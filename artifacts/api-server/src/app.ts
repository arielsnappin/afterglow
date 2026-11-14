import express, { type Express, type ErrorRequestHandler } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const handleError: ErrorRequestHandler = (err, req, res, _next) => {
  // Parser errors may carry the rejected request body; never log uploaded row contents.
  req.log.error({ name: err?.name, type: err?.type }, "Request failed");
  const status = err?.type === "entity.too.large" ? 413 : err instanceof SyntaxError ? 400 : 500;
  res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : "Invalid or oversized request." });
};
app.use(handleError);

export default app;
