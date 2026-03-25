import { z } from 'zod';
import { 
  insertChannelSchema, insertMessageSchema, insertPostSchema, insertCommentSchema, insertMaterialSchema, updateUserSchema 
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    user: {
      method: 'GET' as const,
      path: '/api/auth/user' as const,
      responses: {
        200: z.any(), // Current user
        401: errorSchemas.unauthorized,
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.any()), // List of users for social connect
      }
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/users/profile' as const,
      input: updateUserSchema,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  channels: {
    list: {
      method: 'GET' as const,
      path: '/api/channels' as const,
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/channels' as const,
      input: insertChannelSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    },
    get: {
      method: 'GET' as const,
      path: '/api/channels/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound }
    },
    join: {
      method: 'POST' as const,
      path: '/api/channels/:id/join' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/channels/:channelId/messages' as const,
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/channels/:channelId/messages' as const,
      input: insertMessageSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    }
  },
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts' as const,
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts' as const,
      input: insertPostSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    }
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/posts/:postId/comments' as const,
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts/:postId/comments' as const,
      input: insertCommentSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    }
  },
  materials: {
    list: {
      method: 'GET' as const,
      path: '/api/materials' as const,
      input: z.object({ channelId: z.coerce.number().optional() }).optional(),
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/materials' as const,
      input: insertMaterialSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    }
  },
  admin: {
    universities: {
      method: 'GET' as const,
      path: '/api/admin/universities' as const,
      responses: { 200: z.array(z.any()) }
    },
    createUniversity: {
      method: 'POST' as const,
      path: '/api/admin/universities' as const,
      input: z.object({ name: z.string(), description: z.string().optional() }),
      responses: { 201: z.any(), 400: errorSchemas.validation }
    },
    faculties: {
      method: 'GET' as const,
      path: '/api/admin/faculties/:universityId' as const,
      responses: { 200: z.array(z.any()) }
    },
    createFaculty: {
      method: 'POST' as const,
      path: '/api/admin/faculties' as const,
      input: z.object({ universityId: z.number(), name: z.string(), description: z.string().optional() }),
      responses: { 201: z.any(), 400: errorSchemas.validation }
    },
    departments: {
      method: 'GET' as const,
      path: '/api/admin/departments/:facultyId' as const,
      responses: { 200: z.array(z.any()) }
    },
    createDepartment: {
      method: 'POST' as const,
      path: '/api/admin/departments' as const,
      input: z.object({ facultyId: z.number(), name: z.string(), description: z.string().optional() }),
      responses: { 201: z.any(), 400: errorSchemas.validation }
    }
  },
  friends: {
    send: {
      method: 'POST' as const,
      path: '/api/friends/request/:userId' as const,
      responses: { 201: z.any(), 400: errorSchemas.validation }
    },
    getPending: {
      method: 'GET' as const,
      path: '/api/friends/requests' as const,
      responses: { 200: z.array(z.any()) }
    },
    accept: {
      method: 'POST' as const,
      path: '/api/friends/requests/:requestId/accept' as const,
      responses: { 200: z.any(), 400: errorSchemas.validation }
    },
    reject: {
      method: 'POST' as const,
      path: '/api/friends/requests/:requestId/reject' as const,
      responses: { 200: z.any(), 400: errorSchemas.validation }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
