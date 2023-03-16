module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "semi": ["error", "always"],
        "@typescript-eslint/quotes": [
            "error",
            "single",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        "@typescript-eslint/no-extra-semi": 0,
        "eol-last": 2,
        "no-trailing-spaces": 2,
        "arrow-body-style": ["error", "as-needed"],
        "@typescript-eslint/consistent-type-imports": 2,
        "no-restricted-imports": [
            "error",
            {
                "patterns": ["../"]
            }
        ],
    },

}
