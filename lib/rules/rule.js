module.exports = {
    meta: {
        name: "remove-listeners",
        docs: {
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

        function getElementName(node) {
            let parentObject, element = "window";

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
            return element;
        }
        function getHandlerName(handler) {
            let handlerName;
            if (handler.type === "Identifier") {
                handlerName = handler.name;
            } else if (handler.type === "MemberExpression") {
                handlerName = handler.property ? handler.property.name : undefined;
            } else if (handler.type === "FunctionExpression") {
                handlerName = handler.id.name;
            }
            return handlerName;
        }
        function getEventName(event) {
            let eventName;
            if (event.type === "Literal") {
                eventName = event.value;
            } else if (event.type === "Identifier") {
                eventName = event.name;
            } else if (event.type === "MemberExpression") {
                eventName = event.object.name + "." + event.property.name;
            }
            return eventName;
        }

        function addEventListener(node) {
            if (node.arguments.length < 2) {
                return;
            }

            const event = node.arguments[0];
            const handler = node.arguments[1];
            const options = node.arguments[2];

            if (handler && handler.type === 'FunctionExpression') {
                context.report({
                    node,
                    message: `No inline addEventListener handlers allowed. ${getElementName(node)}.addEventListener('${getEventName(event)}', ${getHandlerName(handler)})`,
                });
            }
            if (handler &&
                !(options && options.type === "ObjectExpression" && options.properties.some(prop => {
                    var name = prop.key.type === "Literal" ? 'value' : 'name';
                    return prop.key[name] === "once";
                })) &&
                ((handler.type === "Identifier") ||
                    (handler.type === "MemberExpression" && handler.object.type === "ThisExpression" && handler.property.type === "Identifier"))
            ) {

                let handlerName = getHandlerName(handler);
                const element = getElementName(node);

                const key = `${element}__${getEventName(event)}__${handlerName || "handler"}`;
                listenerMap.set(key, node);
            }
        }

        function removeEventListener(node) {
            if (node.arguments.length < 2) {
                return;
            }

            const event = node.arguments[0];
            const handler = node.arguments[1];

            if (
                (handler.type === "Identifier" || handler.type === "MemberExpression")
            ) {

                let handlerName = getHandlerName(handler);
                const element = getElementName(node);
                const key = `${element}__${getEventName(event)}__${handlerName}`;

                if (!listenerMap.has(key)) {
                    context.report({
                        node,
                        message: `No corresponding addEventListener found for the ${element}.removeEventListener('${getEventName(event)}', ${handlerName})`,
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
                    const [element, event, handlerName] = key.split("__");
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
