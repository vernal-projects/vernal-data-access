import {ClassType} from "@vernal-projects/framework-core";

export const TRANSACTION_CONTEXT_REGISTRY: Map<ClassType, Array<Function>> = new Map();

export function Transactional(target: object, key?: any, descriptor?: PropertyDescriptor){
    if (key && descriptor){
        // Method Context
        const contexts = getTransactionContexts(target.constructor as ClassType);
        contexts.push(descriptor.value);
    }else {
        // Class Context
        const contexts = getTransactionContexts(target as ClassType);
        const methods = Object.values(Object.getOwnPropertyDescriptors((target as ClassType).prototype)).map(v => v.value).filter(v => v !== target && v instanceof Function);
        for (const value of methods) {
            if (!(contexts.find(v => v === value)))  contexts.push(value);
        }
    }
}

function getTransactionContexts(componentClass: ClassType){
    return TRANSACTION_CONTEXT_REGISTRY.get(componentClass) ?? TRANSACTION_CONTEXT_REGISTRY.set(componentClass, []).get(componentClass)!;
}