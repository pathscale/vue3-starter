/* eslint-disable unicorn/no-unsafe-regex -- ignore */
export const emailValidation = /^(([^<>()\\[\].,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/

export const complexityValidation = /^((?=.*\d)(?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\d\s])|(?=.*\d)(?=.*[A-Z])(?=.*[^\w\d\s])|(?=.*\d)(?=.*[a-z])(?=.*[^\w\d\s]))/

export const required = x => Boolean(x)
