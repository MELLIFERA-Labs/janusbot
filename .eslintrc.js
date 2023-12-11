module.exports =  {
    "env": {
        "es2021": true,
        "node": true
    },
    "parserOptions": {
        "tsconfigRootDir": "./src",
    },
    "extends": ["standard-with-typescript","plugin:prettier/recommended"],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        '@typescript-eslint/strict-boolean-expressions': 'off',
    },
    "overrides": [
        {
            "files": ["src/*.ts"],
        }
    ]
}
