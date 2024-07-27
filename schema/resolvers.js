const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organization = require("../models/organizationModel");
const User = require("../models/userModel");
const Task = require("../models/taskModel");

const checkRole = (user, roles) => {
  if (!roles.includes(user.role)) {
    throw new Error("Access Denied");
  }
};

const resolvers = {
  Query: {
    getOrganizations: async () => {
      try {
        const organizations = await Organization.find();
        return {
          success: true,
          message: "Organizations fetched successfully",
          data: organizations,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching organizations: ${error.message}`,
        };
      }
    },
    getOrganization: async (_, { id }) => {
      try {
        const organization = await Organization.findById(id);
        if (!organization) {
          return {
            success: false,
            message: "Organization not found",
          };
        }
        return {
          success: true,
          message: "Organization fetched successfully",
          data: organization,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching organization: ${error.message}`,
        };
      }
    },
    getUsers: async (_, __, { user }) => {
      try {
        checkRole(user, ["Admin"]);

        const users = await User.find({
          organization: user.organization,
        }).populate("organization");

        return {
          success: true,
          message: "Users fetched successfully",
          data: users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            organization: u.organization
              ? {
                  id: u.organization._id.toString(),
                  name: u.organization.name,
                }
              : null,
          })),
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching users: ${error.message}`,
          data: null,
        };
      }
    },
    getUser: async (_, { id }) => {
      try {
        const user = await User.findById(id).populate("organization");

        if (!user) {
          return {
            success: false,
            message: "User not found",
            data: null,
          };
        }

        return {
          success: true,
          message: "User fetched successfully",
          data: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization
              ? {
                  id: user.organization._id.toString(),
                  name: user.organization.name,
                }
              : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching user: ${error.message}`,
          data: null,
        };
      }
    },
    getTasks: async (_, __, { user }) => {
      try {
        if (!user || !user.organization) {
          throw new Error("User's organization is not available");
        }

        const tasks = await Task.find({ organization: user.organization })
          .populate("assignedTo")
          .populate("createdBy")
          .populate("organization");

        return {
          success: true,
          message: "Tasks fetched successfully",
          data: tasks.map((task) => ({
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate,
            organization: task.organization
              ? {
                  id: task.organization._id.toString(),
                  name: task.organization.name,
                }
              : null,
            createdBy: task.createdBy
              ? {
                  id: task.createdBy._id.toString(),
                  name: task.createdBy.name,
                }
              : null,
            assignedTo: task.assignedTo
              ? {
                  id: task.assignedTo._id.toString(),
                  name: task.assignedTo.name,
                }
              : null,
          })),
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching tasks: ${error.message}`,
          data: [],
        };
      }
    },
    getTask: async (_, { id }) => {
      try {
        const task = await Task.findById(id)
          .populate("assignedTo")
          .populate("createdBy");

        if (!task) {
          return {
            success: false,
            message: "Task not found",
            data: null,
          };
        }

        return {
          success: true,
          message: "Task fetched successfully",
          data: {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate,
            organization: {
              id: task.organization._id.toString(),
              name: task.organization.name,
            },
            createdBy: task.createdBy
              ? {
                  id: task.createdBy._id.toString(),
                  name: task.createdBy.name,
                }
              : null,
            assignedTo: task.assignedTo
              ? {
                  id: task.assignedTo._id.toString(),
                  name: task.assignedTo.name,
                }
              : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error fetching task: ${error.message}`,
          data: null,
        };
      }
    },
  },
  Mutation: {
    createOrganization: async (_, { name }) => {
      try {
        const organization = new Organization({ name });
        await organization.save();
        return {
          success: true,
          message: "Organization created successfully",
          data: organization,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error creating organization: ${error.message}`,
        };
      }
    },
    updateOrganization: async (_, { id, name }) => {
      try {
        const organization = await Organization.findByIdAndUpdate(
          id,
          { name },
          { new: true }
        );
        if (!organization) {
          return {
            success: false,
            message: "Organization not found",
          };
        }
        return {
          success: true,
          message: "Organization updated successfully",
          data: organization,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error updating organization: ${error.message}`,
        };
      }
    },
    deleteOrganization: async (_, { id }) => {
      try {
        const organization = await Organization.findByIdAndDelete(id);
        if (!organization) {
          return {
            success: false,
            message: "Organization not found",
          };
        }
        return {
          success: true,
          message: "Organization deleted successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: `Error deleting organization: ${error.message}`,
        };
      }
    },

    register: async (_, { name, email, password, organizationId, role }) => {
      try {
        const organization = await Organization.findById(organizationId);
        if (!organization) {
          return {
            success: false,
            message: "Organization not found",
            data: null,
          };
        }

        if (role === "Admin") {
          const existingAdmin = await User.findOne({ role: "Admin" });
          if (existingAdmin) {
            return {
              success: false,
              message: "An admin already exists",
              data: null,
            };
          }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            success: false,
            message: "Email already in use",
            data: null,
          };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          organization: organizationId,
          role: role || "User",
        });
        await newUser.save();

        return {
          success: true,
          message: "User registered successfully",
          data: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            organization: {
              id: organization._id.toString(),
              name: organization.name,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error registering user: ${error.message}`,
          data: null,
        };
      }
    },
    login: async (_, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return {
            success: false,
            message: "User not found",
          };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return {
            success: false,
            message: "Invalid password",
          };
        }

        const token = jwt.sign(
          { id: user.id, role: user.role, organization: user.organization },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return {
          success: true,
          message: "Login successful",
          token,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error logging in: ${error.message}`,
        };
      }
    },

    updateUser: async (_, { id, name, email, role }) => {
      try {
        if (role === "Admin") {
          const existingAdmin = await User.findOne({ role: "Admin" });
          if (existingAdmin && existingAdmin.id !== id) {
            return {
              success: false,
              message: "An admin already exists",
              data: null,
            };
          }
        }

        const user = await User.findByIdAndUpdate(
          id,
          { name, email, role },
          { new: true }
        ).populate("organization");

        if (!user) {
          return {
            success: false,
            message: "User not found",
            data: null,
          };
        }

        return {
          success: true,
          message: "User updated successfully",
          data: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization
              ? {
                  id: user.organization._id.toString(),
                  name: user.organization.name,
                }
              : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error updating user: ${error.message}`,
          data: null,
        };
      }
    },
    deleteUser: async (_, { id }) => {
      try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
          return {
            success: false,
            message: "User not found",
          };
        }
        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: `Error deleting user: ${error.message}`,
        };
      }
    },

    createTask: async (
      _,
      { title, description, status, dueDate, assignedTo },
      { user }
    ) => {
      try {
        checkRole(user, ["Manager", "Admin"]);

        const assignedToUser = await User.findById(assignedTo);
        if (!assignedToUser) {
          return {
            success: false,
            message: "Assigned user not found",
          };
        }

        const task = new Task({
          title,
          description,
          dueDate,
          status,
          organization: user.organization,
          createdBy: user.id,
          assignedTo: assignedToUser._id,
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate("assignedTo")
          .populate("organization")
          .exec();

        return {
          success: true,
          message: "Task created successfully",
          data: {
            id: populatedTask._id.toString(),
            title: populatedTask.title,
            description: populatedTask.description,
            dueDate: populatedTask.dueDate,
            status: populatedTask.status,
            organization: {
              id: populatedTask.organization._id.toString(),
              name: populatedTask.organization.name,
            },
            createdBy: {
              id: populatedTask.createdBy.toString(),
              name: (await User.findById(populatedTask.createdBy)).name,
            },
            assignedTo: populatedTask.assignedTo
              ? {
                  id: populatedTask.assignedTo._id.toString(),
                  name: populatedTask.assignedTo.name,
                }
              : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error creating task: ${error.message}`,
        };
      }
    },
    updateTask: async (
      _,
      { id, title, description, status, dueDate, assignedTo }
    ) => {
      try {
        let assignedToId = undefined;

        if (assignedTo) {
          const assignedToUser = await User.findById(assignedTo);
          if (assignedToUser) {
            assignedToId = assignedToUser._id;
          } else {
            return {
              success: false,
              message: "Assigned user not found",
            };
          }
        }

        const task = await Task.findByIdAndUpdate(
          id,
          { title, description, status, dueDate, assignedTo: assignedToId },
          { new: true }
        )
          .populate("assignedTo")
          .populate("organization")
          .exec();

        if (!task) {
          return {
            success: false,
            message: "Task not found",
          };
        }

        return {
          success: true,
          message: "Task updated successfully",
          data: {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate,
            organization: {
              id: task.organization._id.toString(),
              name: task.organization.name,
            },
            createdBy: {
              id: task.createdBy.toString(),
              name: (await User.findById(task.createdBy)).name,
            },
            assignedTo: task.assignedTo
              ? {
                  id: task.assignedTo._id.toString(),
                  name: task.assignedTo.name,
                }
              : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Error updating task: ${error.message}`,
        };
      }
    },
    deleteTask: async (_, { id }) => {
      try {
        const task = await Task.findByIdAndDelete(id);
        if (!task) {
          return {
            success: false,
            message: "Task not found",
          };
        }
        return {
          success: true,
          message: "Task deleted successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: `Error deleting task: ${error.message}`,
        };
      }
    },
  },
};

module.exports = resolvers;
