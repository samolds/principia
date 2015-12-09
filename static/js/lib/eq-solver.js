/*
  eq-solver.js --
  This file defines an object that can iterate over equations to solve for unknown values.
*/

var Solver = (function () {

    function Solver(input) {
        this.params = Object.keys(input)
        this.equations = this.parseEquations(input)
        this.extras = input;
    }
    
    Solver.prototype.parseEquations = function(input){
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
     
        for(var key in input){
          for(var i=0; i<input[key].eq.length; i++)
          {
            var eq = input[key].eq[i];
            for(var re in replacements){
              var repl = replacements[re];
              eq = eq.replace(repl.re, repl.res)
            }
            input[key].eq[i] = eq;
          }
        }
        return input;
    }

    Solver.prototype.solve = function solve(obj) {
        var precision = Globals.dPrecision;
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
        // TODO: Need to be checking for consistent results along the way
        var equations = JSON.parse(JSON.stringify(this.equations))        
        while (solved != needed) {
            changed = false;
            for (var eq in equations) {
            with(Math){
              if(typeof out[eq] == "undefined"){
                for(var i=0; i < equations[eq].eq.length; i++) {
                  if(!(typeof out[eq] == "undefined")) {
                  
                    var result = eval(equations[eq].eq[i]);                  
                    if(result)
                    {
                      if(result != out[eq]){
                        var err = "Warning! Got an inconsistent result:\n";
                        err += "Original: " + eq + " = " + out[eq].toFixed(precision) + ".\n";
                        err += "New: " +  eq + " = " + result.toFixed(precision) + ".\n"
                        $("#solution-details")[0].textContent += err;
                      }
                    }
                    
                    continue;
                  }
                  
                  var result = eval(equations[eq].eq[i]);
                  if (result) {
                    solved++;
                    // TODO: Fire solved event: which equation was used/what was solved for
                    var msg = "Solved for " + eq + ", it is " + result + "!\n";
                    msg += "Try " + this.extras[eq].pretty[i] + ".\n";
                    msg += "You can use some of the values you already know:\n";
                    
                    var variables = this.extras[eq].vars[i];
                    for(var j=0; j<variables.length; j++)
                      msg += this.extras[eq].vars[i][j] + " = " + eval(this.extras[eq].vars[i][j]).toFixed(precision) + "\n";
                    $("#solution-details")[0].textContent += msg;
                    
                    changed = true;
                    out[eq] = result;
                    eval(eq + '=' + result);
                  }
                }
              }
            }
        }
            
        // If no variables could be updated during this iteration, stop making attempts
        if(!changed) break;
      }
    
      return [solved == needed, out];
    }

    return Solver;

}());

if (typeof module !== 'undefined') module.exports = Solver;
