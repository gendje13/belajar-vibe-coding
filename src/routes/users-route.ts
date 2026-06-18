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
        return { error: error.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  );
