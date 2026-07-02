import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Vibe Coding API Documentation",
          version: "1.0.0",
          description: "API Documentation for Belajar Vibe Coding Project",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
    })
  )
  .get("/", () => "OK", {
    response: {
      200: t.String()
    },
    detail: {
      summary: "Health check",
      tags: ["General"],
      responses: {
        200: {
          description: "Server aktif dan berjalan",
          content: {
            "text/plain": {
              example: "OK",
            },
          },
        },
      },
    }
  })
  .use(usersRoute)
  .get("/users", async () => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users);
      return { success: true, data: allUsers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Array(
          t.Object({
            id: t.Numeric(),
            username: t.String(),
            email: t.String(),
            createdAt: t.Any(),
          })
        ),
      }),
      500: t.Object({
        success: t.Boolean(),
        error: t.String(),
      }),
    },
    detail: {
      summary: "Get all users list",
      tags: ["Users"],
      responses: {
        200: {
          description: "Daftar semua pengguna yang terdaftar",
          content: {
            "application/json": {
              example: {
                success: true,
                data: [
                  {
                    id: 1,
                    username: "John Doe",
                    email: "john@example.com",
                    createdAt: "2024-01-15T08:00:00.000Z",
                  },
                ],
              },
            },
          },
        },
        500: {
          description: "Gagal mengambil data dari database",
          content: {
            "application/json": {
              example: { success: false, error: "Database connection error" },
            },
          },
        },
      },
    },
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

