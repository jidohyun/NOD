import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { env } from "@/config/env";

const sdk = new NodeSDK({
  instrumentations: [new HttpInstrumentation(), new FetchInstrumentation()],

  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
  }),

  sampler: new TraceIdRatioBasedSampler(env.OTEL_SAMPLE_RATE),

  traceExporter: new TraceExporter(),
});

sdk.start();
