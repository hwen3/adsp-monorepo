import Ajv from 'ajv';

export const ajv = new Ajv({ allErrors: true, verbose: true });

//Example format: urn:ads:platform:file-service:v1:/files/f6de737e-c5fc-42fe-963b-28bfe14597c4
ajv.addFormat('file-urn', /^urn:ads:platform:file-service:v[0-9]:\/files\/[a-zA-Z0-9.-]*$/);