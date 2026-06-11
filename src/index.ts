import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => "OK")
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
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

