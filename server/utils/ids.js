import crypto from 'node:crypto';
export const makeId=(prefix='id')=>`${prefix}-${crypto.randomUUID()}`;
export const orderNumber=()=>`SH-${crypto.randomInt(1000000,10000000)}`;
export const publicToken=()=>crypto.randomBytes(24).toString('hex');
