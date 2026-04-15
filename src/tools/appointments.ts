import { healthieQuery } from '../services/healthie';

export const appointmentTools = {
  list_appointments: {
    description: 'List appointments with optional filters for patient, provider, date range, and status',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Filter by patient ID' },
        provider_id: { type: 'string', description: 'Filter by provider ID' },
        filter: { type: 'string', description: 'Date filter: upcoming, past, or all' },
        should_paginate: { type: 'boolean', description: 'Enable pagination' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
    handler: async (args: any) => {
      const query = `
        query ListAppointments($user_id: ID, $provider_id: ID, $filter: String, $should_paginate: Boolean, $offset: Int) {
          appointments(user_id: $user_id, provider_id: $provider_id, filter: $filter, should_paginate: $should_paginate, offset: $offset) {
            id date time length reason location status
            appointment_type { id name }
            provider { id first_name last_name }
            user { id first_name last_name }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  create_appointment: {
    description: 'Create a new appointment in Healthie',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Patient ID' },
        appointment_type_id: { type: 'string', description: 'Appointment type ID' },
        contact_type: { type: 'string', description: 'Contact type (eg Video Call, Phone Call, In Person)' },
        datetime: { type: 'string', description: 'Appointment datetime (ISO 8601)' },
        provider_id: { type: 'string', description: 'Provider ID' },
        notes: { type: 'string', description: 'Appointment notes' },
      },
      required: ['user_id', 'appointment_type_id', 'datetime'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CreateAppointment($user_id: ID, $appointment_type_id: ID, $contact_type: String, $datetime: String, $provider_id: String, $notes: String) {
          createAppointment(input: { user_id: $user_id, appointment_type_id: $appointment_type_id, contact_type: $contact_type, datetime: $datetime, provider_id: $provider_id, notes: $notes }) {
            appointment { id date time provider { id first_name last_name } user { id first_name last_name } }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  get_appointment_types: {
    description: 'List all appointment types configured in Healthie',
    inputSchema: { type: 'object' as const, properties: {} },
    handler: async () => {
      const query = `
        query { appointmentTypes { id name length available_contact_types is_active } }
      `;
      return await healthieQuery(query);
    },
  },
};
