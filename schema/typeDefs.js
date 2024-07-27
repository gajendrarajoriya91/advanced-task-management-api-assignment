const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    getOrganizations: OrganizationsResponse
    getOrganization(id: ID!): OrganizationResponse
    getUsers: UsersResponse
    getUser(id: ID!): UserResponse
    getTasks: TasksResponse
    getTask(id: ID!): TaskResponse
  }

  type Mutation {
    createOrganization(name: String!): OrganizationResponse
    updateOrganization(id: ID!, name: String!): OrganizationResponse
    deleteOrganization(id: ID!): GenericResponse
    register(
      name: String!
      email: String!
      password: String!
      organizationId: ID!
      role: String
    ): UserResponse
    login(email: String!, password: String!): LoginResponse
    updateUser(id: ID!, name: String, email: String, role: String): UserResponse
    deleteUser(id: ID!): GenericResponse
    createTask(
      title: String!
      description: String!
      status: String
      dueDate: String
      assignedTo: ID!
    ): TaskResponse
    updateTask(
      id: ID!
      title: String
      description: String
      status: String
      dueDate: String
      assignedTo: ID
    ): TaskResponse
    deleteTask(id: ID!): GenericResponse
  }

  type OrganizationsResponse {
    success: Boolean!
    message: String!
    data: [Organization]
  }

  type OrganizationResponse {
    success: Boolean!
    message: String!
    data: Organization
  }

  type UsersResponse {
    success: Boolean!
    message: String!
    data: [User]
  }

  type UserResponse {
    success: Boolean!
    message: String!
    data: User
  }

  type TasksResponse {
    success: Boolean!
    message: String!
    data: [Task]
  }

  type TaskResponse {
    success: Boolean!
    message: String!
    data: Task
  }

  type LoginResponse {
    success: Boolean!
    message: String!
    token: String
  }

  type GenericResponse {
    success: Boolean!
    message: String!
  }

  type Organization {
    id: ID!
    name: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    organization: Organization!
    role: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String!
    status: String!
    dueDate: String
    organization: Organization!
    createdBy: User!
    assignedTo: User!
  }
`;

module.exports = typeDefs;
