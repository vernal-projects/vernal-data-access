import {
    AppContext,
    ClassType,
    COMPONENT_REGISTRY,
    ContextPlugin,
    StereotypeComponent,
    isSubClass
} from "@vernal-projects/framework-core";
import {DbSessionProxy} from "../db-session-proxy.js";
import {CONNECTION_INJECTION_REGISTRY} from "../decorator/db-session.decorator.js";
import {TRANSACTION_CONTEXT_REGISTRY} from "../decorator/transactional.decorator.js";
import {DataSource} from "../type/data-source.type.js";
import {TransactionManager} from "../type/transaction-manager.type.js";

export class DataAccessContextPlugin extends ContextPlugin {

    private readonly databaseSession = new DbSessionProxy();


    beforeInitialized(context: AppContext, componentDefinitions: Array<ClassType>) {
        const datasourceComponentClass = componentDefinitions.find(cd => isSubClass(cd, DataSource));
        const transactionManagerComponentClass = componentDefinitions.find(cd => isSubClass(cd, TransactionManager));

        if (transactionManagerComponentClass){
            componentDefinitions.splice(context.getComponentDefinitions().indexOf(transactionManagerComponentClass), 1);
            componentDefinitions.unshift(transactionManagerComponentClass);
        }

        /* If datasource component found in the context, we need to shuffle the component definitions  */
        if (datasourceComponentClass){
            componentDefinitions.splice(context.getComponentDefinitions().indexOf(datasourceComponentClass), 1);
            componentDefinitions.unshift(datasourceComponentClass);
        }
    }

    beforeConstructorInjection(context: AppContext, componentClass: ClassType, args: Array<any>) {
        if (!CONNECTION_INJECTION_REGISTRY.has(componentClass)) return;
        const injectionRecords = CONNECTION_INJECTION_REGISTRY.get(componentClass)!;
        if (injectionRecords.length){
            if (COMPONENT_REGISTRY.get(componentClass)!.type !== StereotypeComponent.REPOSITORY) throw new Error("@DbSession is only allowed within repositories");
        }
        const constructorInjectionRecords = injectionRecords.filter(ir => ir.injectionType === "constructor");
        constructorInjectionRecords.forEach(record => {
            args[record.key as number] = this.databaseSession;
        });
    }

    afterPropertyInjections(context: AppContext, componentClass: ClassType, singleton: any) {
        if (TRANSACTION_CONTEXT_REGISTRY.has(componentClass)){
            const transactionContexts = TRANSACTION_CONTEXT_REGISTRY.get(componentClass)!;
            const datasourceComponentClass = context.getComponentDefinitions().find(cd => isSubClass(cd, DataSource));
            const transactionManagerComponentClass = context.getComponentDefinitions().find(cd => isSubClass(cd, TransactionManager));
            if (!datasourceComponentClass) {
                throw new Error("No datasource component configured in the context");
            }else if (!transactionManagerComponentClass){
                throw new Error("No transaction manager component configured for the datasource in the context");
            }else if (datasourceComponentClass === componentClass || transactionManagerComponentClass === componentClass){
                throw new Error(`@Transactional is not allowed in the ${datasourceComponentClass.name}`)
            }
            const datasource = context.getComponent<DataSource<any>>(COMPONENT_REGISTRY.get(datasourceComponentClass)!.token);
            const transactionManager = context.getComponent<TransactionManager<any>>(COMPONENT_REGISTRY.get(transactionManagerComponentClass)!.token);
            for (const transactionContext of transactionContexts) {
                singleton[transactionContext.name] = async function(...args: Array<any>){
                    return DbSessionProxy.getDbSessionStorage().run(new Map(), async ()=>{
                        const connection = await datasource.getConnection();
                        DbSessionProxy.getDbSessionStorage().getStore().set("connection", connection);
                        try {
                            await transactionManager.begin(connection, datasource);
                            const result = await transactionContext.call(this, ...args);
                            await transactionManager.commit(connection, datasource);
                            return result;
                        }catch(e){
                            await transactionManager.rollback(connection, datasource);
                            throw e;
                        }finally {
                            datasource.close(connection);
                        }
                    });
                }
            }
        }

        if (!CONNECTION_INJECTION_REGISTRY.has(componentClass)) return;
        const injectionRecords = CONNECTION_INJECTION_REGISTRY.get(componentClass)!;
        const propertyInjectionRecords = injectionRecords.filter(ir => ir.injectionType === "property");
        propertyInjectionRecords.forEach(record => {
            singleton[record.key] = this.databaseSession;
        });
    }

}

AppContext.registerPlugin(new DataAccessContextPlugin());