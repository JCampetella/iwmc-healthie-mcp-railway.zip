import { healthieQuery } from '../services/healthie';

export const documentTools = {
  list_documents: {
    description: 'List documents for a patient in Healthie',
    inputSchema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'Patient ID' },
        offset: { type: 'number' },
      },
      required: ['client_id'],
    },
    handler: async (args: any) => {
      const query = `
        query ListDocuments($client_id: ID, $offset: Int) {
          documents(client_id: $client_id, offset: $offset) {
            id display_name description created_at content_type
            rel_user { id first_name last_name }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },
};

export const conversationTools = {
  get_conversations: {
    description: 'Get conversations for a patient',
    inputSchema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'Patient ID' },
        offset: { type: 'number' },
      },
    },
    handler: async (args: any) => {
      const query = `
        query GetConversations($client_id: ID, $offset: Int) {
          conversationMemberships(client_id: $client_id, offset: $offset) {
            id convo { id created_at updated_at }
            display_name last_message_content
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  create_conversation: {
    description: 'Send a message to a patient via Healthie messaging',
    inputSchema: {
      type: 'object' as const,
      properties: {
        recipient_id: { type: 'string', description: 'Patient ID to message' },
        content: { type: 'string', description: 'Message content' },
      },
      required: ['recipient_id', 'content'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CreateConversation($recipient_id: ID, $simple_added_users: String, $initial_message: String) {
          createConversation(input: { recipient_id: $recipient_id, simple_added_users: $simple_added_users, initial_message: $initial_message }) {
            conversation { id }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, {
        recipient_id: args.recipient_id,
        simple_added_users: args.recipient_id,
        initial_message: args.content,
      });
    },
  },
};

export const chartNoteTools = {
  get_chart_notes: {
    description: 'Get chart notes (encounter notes) for a patient',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Patient ID' },
        offset: { type: 'number' },
      },
      required: ['user_id'],
    },
    handler: async (args: any) => {
      const query = `
        query GetChartNotes($user_id: ID!, $offset: Int) {
          formAnswerGroups(user_id: $user_id, offset: $offset) {
            id name created_at finished
            form_answers { id label answer displayed_answer }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  create_chart_note: {
    description: 'Create a chart note for a patient in Healthie',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Patient ID' },
        form_id: { type: 'string', description: 'Form template ID to use' },
        finished: { type: 'boolean', description: 'Mark as complete' },
      },
      required: ['user_id', 'form_id'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CreateChartNote($user_id: ID, $form_id: ID, $finished: Boolean) {
          createFormAnswerGroup(input: { user_id: $user_id, form_id: $form_id, finished: $finished }) {
            form_answer_group { id name created_at }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },
};

export const taskTools = {
  get_tasks: {
    description: 'Get tasks, optionally filtered by patient or completion status',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Filter by patient ID' },
        completed: { type: 'boolean', description: 'Filter by completion status' },
        offset: { type: 'number' },
      },
    },
    handler: async (args: any) => {
      const query = `
        query GetTasks($user_id: ID, $completed: Boolean, $offset: Int) {
          tasks(user_id: $user_id, completed_status: $completed, offset: $offset) {
            id content due_date completed created_at
            client { id first_name last_name }
            creator { id first_name last_name }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  create_task: {
    description: 'Create a task in Healthie (e.g., follow-up, lab order reminder)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'Task content/description' },
        user_id: { type: 'string', description: 'Patient ID to assign task to' },
        due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        reminder: { type: 'boolean', description: 'Send reminder' },
      },
      required: ['content'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CreateTask($content: String, $user_id: ID, $due_date: String, $reminder: Boolean) {
          createTask(input: { content: $content, user_id: $user_id, due_date: $due_date, reminder: $reminder }) {
            task { id content due_date }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },

  complete_task: {
    description: 'Mark a task as completed',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
    handler: async (args: any) => {
      const query = `
        mutation CompleteTask($id: ID!) {
          updateTask(input: { id: $id, completed: true }) {
            task { id content completed }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },
};

export const tagTools = {
  get_tags: {
    description: 'List all available tags in Healthie',
    inputSchema: { type: 'object' as const, properties: {} },
    handler: async () => {
      const query = `query { tags { id name } }`;
      return await healthieQuery(query);
    },
  },

  apply_tag: {
    description: 'Apply a tag to a patient',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'Patient ID' },
        tag_id: { type: 'string', description: 'Tag ID to apply' },
      },
      required: ['user_id', 'tag_id'],
    },
    handler: async (args: any) => {
      const query = `
        mutation ApplyTag($user_id: ID, $tag_id: ID) {
          createTag(input: { user_id: $user_id, id: $tag_id }) {
            tag { id name }
            messages { field message }
          }
        }
      `;
      return await healthieQuery(query, args);
    },
  },
};

export const providerTools = {
  get_providers: {
    description: 'List all providers in the Healthie organization',
    inputSchema: { type: 'object' as const, properties: {} },
    handler: async () => {
      const query = `
        query { organizationMembers { id first_name last_name email role } }
      `;
      return await healthieQuery(query);
    },
  },
};
