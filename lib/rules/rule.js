module.exports = {
    meta: {
        name: "remove-listeners",
        docs: {
            // name: "require-remove-eventlisteners",
            description: "Require a corresponding removeEventListener for each addEventListener",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
    },
    create: function (context) {
        const listenerMap = new Map();

        function isRemoveEventListener(node) {
            return (
                node.type === "CallExpression" &&
                node.callee.property &&
                node.callee.property.name === "removeEventListener"
            );
        }

        function addEventListener(node) {
            if (node.arguments.length < 2) {
                return;
            }

            const event = node.arguments[0];
            const handler = node.arguments[1];
            const options = node.arguments[2];

            console.log(event.type);
            console.log(handler.type)


            if (event.type === "Literal" && handler && handler.type === 'FunctionExpression') {
                context.report({
                    node,
                    message: `No inline addEventListener handlers allowed. ${node.callee.object.name}.addEventListener('${event.value}', ${handler.id.name})`,
                });
            }
            if (
                event.type === "Literal" &&
                handler &&
                !(options && options.type === "ObjectExpression" && options.properties.some(prop => {
                    var name = prop.key.type === "Literal" ? 'value' : 'name';
                    return prop.key[name] === "once";
                })) &&
                ((handler.type === "Identifier") ||
                    (handler.type === "MemberExpression" && handler.object.type === "ThisExpression" && handler.property.type === "Identifier"))
            ) {
                console.log("IN")

                let handlerName;
                if (handler.type === "Identifier") {
                    handlerName = handler.name;
                } else if (handler.type === "MemberExpression") {
                    handlerName = handler.property ? handler.property.name : undefined;
                }

                let element = "window"; // Default element is window
                let parentObject;
                // If the callee object is specified and it's not the window or document object,
                // include it in the key
                if (node.callee.object && node.callee.object.type === "MemberExpression" && node.callee.object.object) {

                    if (node.callee.object.property.name !== undefined) {

                        parentObject = node.callee.object.property.name;
                    }
                    element = parentObject || "window"; // Use "window" as default if parentObject is undefined
                } else if (node.callee.object && node.callee.object.name === "document") {
                    element = "document";
                } else if (node.callee.object && node.callee.object.type === "ThisExpression") {
                    element = "this";
                } else if (node.callee.object && node.callee.object.name !== undefined) {
                    element = node.callee.object.name;
                }

                const key = `${element}_${event.value}_${handlerName || "handler"}`;
                console.log(key);
                listenerMap.set(key, node);
            }
        }

        function removeEventListener(node) {
            if (node.arguments.length < 2) {
                return;
            }
            console.log("IN REMOVE");
            const event = node.arguments[0];
            const handler = node.arguments[1];

            console.log(event.type)
            console.log(handler.type)
            if (
                event.type === "Literal" &&
                (handler.type === "Identifier" || handler.type === "MemberExpression")
            ) {
                let handlerName;
                let parentObject;
                if (handler.type === "Identifier") {
                    handlerName = handler.name;
                } else if (handler.type === "MemberExpression") {
                    // If the handler is a MemberExpression, extract the property name
                    handlerName = handler.property.name;

                }
                if (node.callee.object && node.callee.object.type === "MemberExpression" && node.callee.object.object) {
                    if (node.callee.object.property.name !== undefined) {
                        parentObject = node.callee.object.property.name;
                    }
                }
                let element = parentObject || "window";

                if (node.callee.object && node.callee.object.name === "document") {
                    element = "document";
                } else if (node.callee.object && node.callee.object.type === "ThisExpression") {
                    element = "this";
                } else if (node.callee.object && node.callee.object.name !== undefined) {
                    element = node.callee.object.name;
                }

                const key = `${element}_${event.value}_${handlerName}`;

                console.log(key)
                if (!listenerMap.has(key)) {
                    context.report({
                        node,
                        message: `No corresponding addEventListener found for the ${element}.removeEventListener('${event.value}', ${handlerName})`,
                    });
                } else {
                    listenerMap.delete(key);
                }
            }
        }

        return {
            CallExpression(node) {
                if (node.callee.property && node.callee.property.name === "addEventListener") {
                    addEventListener(node);
                } else if (isRemoveEventListener(node)) {
                    removeEventListener(node);
                }
            },
            // Report any addEventListeners that haven't been removed
            "Program:exit"() {
                listenerMap.forEach((value, key) => {
                    const [element, event, handlerName] = key.split("_");
                    const loc = value.loc.start;
                    context.report({
                        loc: { line: loc.line, column: loc.column },
                        node: value,
                        message: `EventListener added for '${event}' on '${element}' but not removed with removeEventListener for handler '${handlerName}'`,
                    });
                });
            },
        };
    },
};
