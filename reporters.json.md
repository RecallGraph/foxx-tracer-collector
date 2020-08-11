# Instructions
Add namespaced reporter packages to an object and save to `reporters.json`.
The keys are the namespaces, and the values are the package names (optionally with version tags).

During the build process, these modules will be installed (in the `build` folder), and their configs (from the package's `manifest-config.json`) will be merged with the service's `manifest.json`, under the `configuration` object (namespaced).

# Example `reporters.json`
```
{
    "console": "@recallgraph/foxx-tracer-reporter-console@latest"
}
```

The `build/manifest.json` would now have a `configuration` object containing the following:

```
// build/manifest.json

{
    ...
    "configuration": {
        ...
        "reporters:console": {
            "level": "debug"
        },
        ...
    },
    ...
}
```
