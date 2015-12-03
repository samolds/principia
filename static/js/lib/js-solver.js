var Solver = (function () {

    function Solver(equations) {
        this.params = Object.keys(equations)
        this.equations = this.parseEquations(equations)
    }
    
    Solver.prototype.parseEquations = function(equations){
        var replacements = {
            power : {
                re: /([\w.]+)\^([\w.]+)/g,
                res: 'Math.pow($1,$2)'
            },
            powerPython : {
                re: /([\w.]+)\*\*([\w.]+)/g,
                res: 'Math.pow($1,$2)'
            },
        }
        for(var key in equations){
            var eq = equations[key]
            for(var re in replacements){
                var repl = replacements[re]
                eq = eq.replace(repl.re, repl.res)
            }
            equations[key] = eq
        }
        return equations;
    }

    Solver.prototype.solve = function solve(obj) {
        var out = {};
        var needed = Object.keys(this.equations).length; // Number of variables to solve for
        var solved = 0; // Number of variables solved for
		var changed = false; // Made an update during the previous iteration

		// Undefine all variables used in this Solver
        for (var key = 0; key < this.params.length; key++) {
            eval(this.params[key] + '=undefined')
        }

		// Define variables described by input
        for (var key in obj) {
            if (this.params.indexOf(key) != -1 && (obj[key]==0 || obj[key])) {
                eval(key + '=' + obj[key]);
                out[key] = obj[key];
				solved++;
            }
        }
		
		// Attempt to define variables not described by input
        var equations = JSON.parse(JSON.stringify(this.equations))
        while (solved != needed) {         
			changed = false;
            for (var eq in equations) {
                with(Math){
					if(typeof out[eq] == "undefined")
					{
						var result = eval(equations[eq]);
						if (result) {
							solved++;
							changed = true;
							out[eq] = result;
							eval(eq + '=' + result);							
						}
					}
				}                
            }
            
			// If no variables could be updated during this iteration, stop making attempts
			if(!changed) break;
        }
		
        return out;
    }

    return Solver;

}());

if (typeof module !== 'undefined') module.exports = Solver;