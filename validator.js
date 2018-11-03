/**
 * Checks a variable against a list of parameters
 * @param {object[]} configs - a list of objects containing variables to be validated and the rules for validation
 * @param {string} configs[].variableValue - the value of the variable to be checked
 * @param {string} configs[].variableText - the name of the variable to be used in the error return strings.
 * @param {number} configs[].min - the minimum characters the variable should be
 * @param {number} configs[].max - the maximum characters the variable should be
 * @returns {string[]} - array of strings containing errors
 */
validateSize = (configs) => {
    let errors = [];

    for(let i=0; i < configs.length; i++){
        if(configs[i].variableValue.length < configs[i].min){ 
            errors.push(configs[i].variableText + ' უნდა იყოს მინიმუმ ' + configs[i].min + ' ასო.');
        } else if(configs[i].variableValue.length > configs[i].max){ 
            errors.push(configs[i].variableText + ' უნდა იყოს მაქსიმუმ ' + configs[i].max + ' ასო.');
        }
    }
    
    return errors;
}

/**
 * Checks a request body against an array of required variables
 * @param {object} body - the express request.body object
 * @param {object[]} variables - the variables that are required in the request
 * @param {string} variables[].variable - the name of the variable to be checked
 * @param {string} variables[].variableText - the name of the variable to be used in the return string.
 * @returns {string[]} - a list of strings containing errors
 */
validateRequest = (body, variables) => {
    let existenceErrors = [];

    for(let i=0; i < variables.length; i++){
        if(!body.hasOwnProperty(variables[i].variable) || body[variables[i].variable] === ''){ 
            existenceErrors.push('გთხოვთ შეიყვანოთ ' + variables[i].variableText) 
        }
    }

    return existenceErrors;
}

/**
 * Takes an express request body and a config object and validates it.
 * @param {object} body - an express request.body object
 * @param {object[]} configs - a list of objects containing variables to be validated and the rules for validation
 * @param {string} configs[].variable - the name of the variable to be checked
 * @param {string} configs[].variableText - the name of the variable to be used in the error return strings.
 * @param {number} configs[].min - the minimum characters the variable should be
 * @param {number} configs[].max - the maximum characters the variable should be
 * @returns {string[]} - a list of strings containing errors
 */
validate = (body, configs) => {
    let errors = validateRequest(body, configs);

    if(errors == []){ return errors; }
    
    //Assign variableValue only after checking if the body actually has these values.
    for(let i = 0; i < configs.length; i++){
        configs[i].variableValue = body[configs[i].variable];
    }

    errors = validateSize(configs);

    return errors;
}

module.exports = {
    validate
}