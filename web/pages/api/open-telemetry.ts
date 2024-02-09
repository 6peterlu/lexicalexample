import { Resource } from '@opentelemetry/resources';
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter
} from '@opentelemetry/sdk-trace-base';
import { trace, context } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

console.log('configuring telemetry');

// **DELETE IF SETTING UP A GATEWAY, UNCOMMENT OTHERWISE**
// const { GraphQLInstrumentation } = require ('@opentelemetry/instrumentation-graphql');

// Register server-related instrumentation
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation()
  ]
});

// Initialize provider and identify this particular service
// (in this case, we're implementing a federated gateway)
const provider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      // Replace with any string to identify this service in your system
      'service.name': 'web'
    })
  )
});

// Configure a test exporter to print all traces to the console
// const consoleExporter = new ConsoleSpanExporter();
// provider.addSpanProcessor(
//   new SimpleSpanProcessor(consoleExporter)
// );
provider.addSpanProcessor(
  new SimpleSpanProcessor(new OTLPTraceExporter())
);

// Register the provider to begin tracing
provider.register();
export const tracer = trace.getTracer('next-app-tracer');
export { context };
