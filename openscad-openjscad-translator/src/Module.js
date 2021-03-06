define("Module", ["Context", "Globals"], function(Context, Globals){

    function Module(name) {
        this.name = name;
        this.children = [];
        this.assignments_var = {};
        this.functions = {};
        this.modules = [];
        this.argnames = [];
        this.argexpr = [];
    };

    Module.prototype.evaluate = function(parentContext, inst) {
        var lines = [];

        var context = new Context(parentContext);

        if (parentContext === undefined){
            context.setVariable("$fn", Globals.DEFAULT_RESOLUTION);
            context.setVariable("$fs", 2.0);
            context.setVariable("$fa", 12.0);
        }

        if (inst !== undefined) {
            context.args(this.argnames, this.argexpr, inst.argnames, inst.argvalues);
            context.setVariable("$children", inst.children.length);
        }

        context.inst_p = inst;
        context.functions_p = this.functions;
        context.modules_p = this.modules;
        _.each(this.assignments_var, function(value, key, list) {
            // console.log("setting variable:" + key + ": " + value.evaluate(context));
            context.setVariable(key, value.evaluate(context));
        });

        // filter out echo statements
        var controlChildren = _.filter(this.children, function(child){ 
            return child && child.name == "echo"; 
        });

        // handle echo statements
        _.each(controlChildren, function(child, index, list) {
            child.evaluate(context);
        });

        var nonControlChildren = _.reject(this.children, function(child){ 
            return !child || child.name == "echo"; 
        });

        var evaluatedLines = [];
        _.each(nonControlChildren, function(child, index, list) {
            var evaluatedChild = child.evaluate(context)
            if (evaluatedChild == undefined || (_.isArray(evaluatedChild) && _.isEmpty(evaluatedChild))){
                // ignore
            } else {
                evaluatedLines.push(evaluatedChild);
            }
        });

        // this handles implicit unioning of multiple things in the space.  I may want to change this
        // to speed things up.
        var cleanedLines = _.compact(evaluatedLines);
        if (cleanedLines.length == 1){
            lines.push(cleanedLines[0]);
        } else if (cleanedLines.length > 1){
            lines.push(_.first(cleanedLines)+".union([" +_.rest(cleanedLines)+"])");
        }
        
        return lines;
    };

	return Module;
});