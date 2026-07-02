import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

const usersService = new UsersService();

export const usersRoute = new Elysia()
  .post(
    "/api/users",
    async ({ body, set }) => {
      try {
        const result = await usersService.register(body);
        return { data: result };
      } catch (error: any) {
        if (error.message === "Email sudah terdaftar") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 255 }),
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
      detail: {
        summary: "Register new user",
        tags: ["Users"],
        responses: {
          200: {
            description: "Pendaftaran berhasil",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          400: {
            description: "Email sudah terdaftar",
            content: {
              "application/json": {
                example: { error: "Email sudah terdaftar" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                example: { error: "Internal Server Error" },
              },
            },
          },
        },
      },
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const token = await usersService.login(body);
        return { data: token };
      } catch (error: any) {
        if (error.message === "Email atau password salah") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
      detail: {
        summary: "User login",
        tags: ["Users"],
        responses: {
          200: {
            description: "Login berhasil, token sesi dikembalikan",
            content: {
              "application/json": {
                example: { data: "550e8400-e29b-41d4-a716-446655440000" },
              },
            },
          },
          400: {
            description: "Email atau password salah",
            content: {
              "application/json": {
                example: { error: "Email atau password salah" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                example: { error: "Internal Server Error" },
              },
            },
          },
        },
      },
    }
  )
  .get(
    "/api/users/current",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const user = await usersService.getCurrentUser(token);
        return { data: user };
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Numeric(),
            name: t.String(),
            email: t.String(),
            created_at: t.Any(),
          }),
        }),
        401: t.Object({ error: t.String() }),
      },
      detail: {
        summary: "Get current user profile",
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Data profil pengguna yang sedang login",
            content: {
              "application/json": {
                example: {
                  data: {
                    id: 1,
                    name: "John Doe",
                    email: "john@example.com",
                    created_at: "2024-01-15T08:00:00.000Z",
                  },
                },
              },
            },
          },
          401: {
            description: "Token tidak valid atau tidak disertakan",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    }
  )
  .delete(
    "/api/users/logout",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const result = await usersService.logout(token);
        return { data: result };
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
      },
      detail: {
        summary: "User logout",
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Logout berhasil, sesi dihapus",
            content: {
              "application/json": {
                example: { data: "OK" },
              },
            },
          },
          401: {
            description: "Token tidak valid atau tidak disertakan",
            content: {
              "application/json": {
                example: { error: "Unauthorized" },
              },
            },
          },
        },
      },
    }
  );

