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
        return { error: error.message || "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
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
    }
  );

