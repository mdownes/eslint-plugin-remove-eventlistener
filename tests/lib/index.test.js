let { RuleTester } = require('eslint');
let rule = require('../../lib/rules/rule');
let ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });

ruleTester.run("require-remove-eventlistener", rule, {
    valid: [{
        code: `
        function globalFN() { };
        class test {
            doSomething() { }
            doSomething1() { }
            doSomething2() { }
            connectedCallback() {
                document.addEventListener('keyup', this.doSomething);
                document.removeEventListener('keyup', this.doSomething);
                this.addEventListener('keyup', this.doSomething1);
                this.removeEventListener('keyup', this.doSomething1);
                this.div = document.createElement('div');
                this.div.addEventListener('keyup', this.doSomething2);
                this.div.removeEventListener('keyup', this.doSomething2);
                document.addEventListener('keyup', globalFN);
                document.removeEventListener('keyup', globalFN);

            }
        };
        `,
    },
    {   // Test that an addEventListener with a once options does not raise an error as it is automatically removed.
        // Also test when the once is in quotes as the ast model is different in this case.
        code: `
        class test  {
            doSomething() {}
            connectedCallback() {
                document.addEventListener('keyup', this.doSomething, {once: true }); 
                document.addEventListener('keyup', this.doSomething, {'once': true });            
            }
        };
        `,
    }],
    invalid: [{
        code: `
        class test  {
            doSomething() {}
            connectedCallback() {
                document.addEventListener('click', this.doSomething);
                this.addEventListener('click', this.doSomething);
                this.div  = document.createElement('div');
                this.div.addEventListener('click', this.doSomething);
            }
        };
        `,
        errors: [
            {
                message: "EventListener added for 'click' on 'document' but not removed with removeEventListener for handler 'doSomething'",
            },
            {
                message: "EventListener added for 'click' on 'this' but not removed with removeEventListener for handler 'doSomething'",
            },
            {
                message: "EventListener added for 'click' on 'div' but not removed with removeEventListener for handler 'doSomething'",
            },

        ]
    },
    { //Test that document, this and element(div)report and error if there is no corresponding addEventListener
        code: `
        class test  {
            doSomething() {}
            connectedCallback() {
                document.removeEventListener('click', this.doSomething);
                this.removeEventListener('click', this.doSomething);
                this.div  = document.createElement('div');
                this.div.removeEventListener('click', this.doSomething);
            }
        };
        `,
        errors: [
            {
                message: "No corresponding addEventListener found for the document.removeEventListener('click', doSomething)",
            },
            {
                message: "No corresponding addEventListener found for the this.removeEventListener('click', doSomething)",
            },
            {
                message: "No corresponding addEventListener found for the div.removeEventListener('click', doSomething)",
            },

        ]
    }, {//Test that inline functions are not used as handlers. This means they cant be removed correctly.
        code: `
        document.addEventListener('click', function testFn(){});
        this.addEventListener('keyup', function testFn(){});`,
        errors: [
            { message: `No inline addEventListener handlers allowed. document.addEventListener('click', testFn)` },
            { message: `No inline addEventListener handlers allowed. this.addEventListener('keyup', testFn)` }
        ]
    }],
});


console.log("All tests passed!");