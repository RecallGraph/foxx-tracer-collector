# foxx-tracer-collector
A Foxx microservice that acts as a collector agent for [OpenTracing](https://opentracing.io/) [spans](https://opentracing.io/specification/#the-opentracing-api) emitted by [foxx-tracer](https://github.com/RecallGraph/foxx-tracer).

## Why another collector agent?
One might ask why, in the presence of so many available collectors ([Zipkin](https://zipkin.io/pages/architecture.html#zipkin-collector), [OpenCensus Collector](https://opencensus.io/service/components/collector/), [Jaeger](https://www.jaegertracing.io/docs/1.18/architecture/#collector), etc.) do we need another collector service. 

Listed below are some reasons why *foxx-tracer-collector* was created:
1. Traces (a trace is a collection of interrelated spans) generated inside a [Foxx Microservice](https://www.arangodb.com/docs/stable/foxx.html) have to be shipped out to an external system where they can be stored and analyzed. Unfortunately, the Foxx runtime is extremely restrictive about how its mounted services can communicate with the outside world.
1. The only allowed networking option is to use Foxx's built-in [request](https://www.arangodb.com/docs/stable/foxx-guides-making-requests.html) module, but that too is entirely synchronous - meaning we cannot insert trace-posting requests in the main execution path without severely degrading latency and throughput metrics.
1. All existing CommonJS OpenTracing client libraries are naturally asynchronous in order to avoid this penalty, but this also means they cannot run within a Foxx V8 context. Therefore, a 100% synchronous client library is also required. This requirement is fulfilled by [foxx-tracer](https://github.com/RecallGraph/foxx-tracer) - a companion client library for *foxx-tracer-collector*.
1. One way to achieve asynchronous execution in Foxx is to use the [Task API](https://www.arangodb.com/docs/3.6/appendix-java-script-modules-tasks.html), but that would mean burdening the service with continually generating asynchronous tasks just to push out trace data, which is not its primary function.
1. There are other, more nuanced limitations, imposed by the 100% synchronous runtime (that distributes a service deployment across multiple, isolated V8 contexts in singular instances as well as in clusters), which make an in-memory trace-buffering mechanism (with periodic, task-based flush) unfeasible.
1. Due to the reasons stated above, every trace that is initiated by an incoming request has to be flushed immediately once the request has been served. Naturally, this must be done with as little lag as possible.
1. This is where *foxx-tracer-collector* comes to the rescue. It runs beside your traced service in the same DB instance, and works in tandem with the *foxx-tracer* client (installed in your service) to record spans by means of an exported function that is **directly invoked** (in-process) and returns instantly, with no blocking I/O performed.

## How it works
Once a trace has been offloaded to the collector, your service is free to go back to its primary business, which is to serve user requests.

The collector, in turn, asynchronously persists the trace to DB (via the Tasks API), and then periodically pushes all pending traces to designated endpoints (via pluggable [reporters](#reporters)). Recorded traces are assigned a configurable TTL, after which they are expunged from the database, thereby keeping things light and nimble.

## Reporters
*foxx-tracer-collector* uses a system of pluggable *reporters* to push its received traces to various destinations. More than one reporter can be active at a time, in which case all of them are invoked to push the traces to their respective endpoints.

The collector comes with two reporters pre-installed:
1. A *noop* reporter that does nothing. This reporter cannot be removed, but it can be disabled.
1. A [console reporter](https://github.com/RecallGraph/foxx-tracer-reporter-console) that prints traces to the ArangoDB log. This reporter can be removed or disabled if required.

Neither of these reporters is particularly useful for production setups, but are useful for debugging purposes.

More useful (for actual trace capture and analysis) reporters can be found by searching the [NPM registry](https://www.npmjs.com/) for the keyword **"foxx-tracer-reporter"**. At the time of this writing, there is a production-ready reporter available for the [Datadog Cloud Monitoring Service](https://www.datadoghq.com/) service. It is named [foxx-tracer-reporter-datadog](https://github.com/RecallGraph/foxx-tracer-reporter-datadog).

### Custom Reporters
If you don't find a reporter for your specific endpoint, you can easily [write one yourself](https://github.com/RecallGraph/foxx-tracer-reporter-console#writing-your-own-reporter)!

## Installation and Configuration
See the [wiki](https://github.com/RecallGraph/foxx-tracer-collector/wiki) for instructions.