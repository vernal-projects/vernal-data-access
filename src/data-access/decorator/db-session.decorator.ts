import {ClassType, InjectionRecordType} from "@vernal-projects/framework-core";

export const CONNECTION_INJECTION_REGISTRY: Map<ClassType, Array<InjectionRecordType>> = new Map();

export function DbSession(target: Object, key: any, index?: number) {
    if (index === undefined) {
        // property injection
        const componentClass = target.constructor as ClassType;
        const injectionRecords = CONNECTION_INJECTION_REGISTRY.get(componentClass) ?? CONNECTION_INJECTION_REGISTRY.set(target.constructor as ClassType, []).get(componentClass)!;
        injectionRecords.push({
            key, token: "db-session", injectionType: "property"
        });
    } else {
        // constructor injection
        const componentClass = target as ClassType;
        const injectionRecords = CONNECTION_INJECTION_REGISTRY.get(target as ClassType) ?? CONNECTION_INJECTION_REGISTRY.set(componentClass as ClassType, []).get(componentClass)!;
        injectionRecords.push({
            key: index, token: "db-session", injectionType: "constructor"
        });
    }
}