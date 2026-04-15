import { healthieQuery } from '../services/healthie';

export const patientTools = {
  // List patients
  list_patients: {
    description: 'List patients from Healthie with optional search and pagination',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offset: { type: 'number', description: 'Pagination offset' },
        keywords: { type: 'string', description: 'Search keywords (name, email, phone)' },
        active_status: { type: 'string', enum: ['active', 'archived', 'all'], description: 'Filter by status' },
        sort_by: { type: 'string', description: 'Sort field' },
      },
    },
    handler: async (args: any) => {
      const query = `
        query ListPatients($offset: Int, $keywords: String, $active_status: String, $sort_by: String) {
          users(offset: $offset, keywords: $keywords, active_status: $active_status, sort_by: $sort_by) {
            id first_name last_name email phone_number dob
            active_status created_at updated_at
            dietitian { id first_name last_name }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  // Get patient by ID
  get_patient: {
    description: 'Get a specific patient by their Healthie ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Patient Healthie ID' },
      },
      required: ['id'],
    },
    handler: async (args: any) => {
      const query = `
        query GetPatient($id: ID!) {
          user(id: $id) {
            id first_name last_name email phone_number dob gender
            active_status created_at updated_at
            height weight
            dietitian { id first_name last_name }
            tags { id name }
            locations { id name }
          }
        }
      `;
      return await healthieQuery(query, { id: args.id });
    },
  },

  // Create patient
  create_patient: {
    description: 'Create a new patient in Healthie',
    inputSchema: {
      type: 'object' as const,
      properties: {
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        email: { type: 'string', description: 'Email address' },
        phone_number: { type: 'string', description: 'Phone number' },
        dob: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
        gender: { type: 'string', description: 'Gender' },
        dietitian_id: { type: 'string', description: 'Assigned provider ID' },
      },
      required: ['first_name', 'last_name', 'email'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CreatePatient(
          $first_name: String, $last_name: String, $email: String,
          $phone_number: String, $dob: String, $gender: String, $dietitian_id: String
        ) {
          createClient(input: {
            first_name: $first_name, last_name: $last_name, email: $email,
            phone_number: $phone_number, dob: $dob, gender: $gender, dietitian_id: $dietitian_id
          }) {
            user { id first_name last_name email }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  // Update patient
  update_patient: {
    description: 'Update an existing patient in Healthie',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Patient ID' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
        dob: { type: 'string' },
        active_status: { type: 'string', enum: ['active', 'archived'] },
      },
      required: ['id'],
    },
    handler: async (args: any) => {
      const query = `
        mutation UpdatePatient($id: ID!, $first_name: String, $last_name: String, $email: String, $phone_number: String, $dob: String, $active_status: String) {
          updateClient(input: { id: $id, first_name: $first_name, last_name: $last_name, email: $email, phone_number: $phone_number, dob: $dob, active_status: $active_status }) {
            user { id first_name last_name email active_status }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },
};
