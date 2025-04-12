## Code Style & Structure

- Use TypeScript except if it's a config file that requires JS. All functions as `const` arrow functions with implicit returns.
- Base code on `rag-content.md` without modifying the existing project architecture.
- Remove all comments from the code, except for `// @ts-ignore`.
- Do not add comments in the generated code.
- Prefer one-liner logic:
  condition && action()
  callback?.()
- Always use lodash utilities like `isEmpty` for checks.
- Use `@legendapp/state` 3.0.0 for global state. Avoid using `.get()` and `.set()` methods, use `$` notation from `enable$GetSet()` feature.
- Use `@tanstack/react-query` for data fetching, with best practices like optimistic updates.
  const { data } = useQuery({ ... })
- Always use path alias in import
- Do not create or update markdown file to explain what you did.
- Do not create Windows OS adaptation.

## Formatting & Linting

- Adhere to Prettier/ESLint rules: omit semicolons and use single quotes.
- In JSX, minimize curly braces and delegate logic to custom hooks.

## Routing, Fetching & State Management

- Use the Next.js App Router (e.g., with `route.ts` GET/POST functions).
- Use `@tanstack/react-query` for data fetching, with best practices like optimistic updates.
- Use axios to consume APIs instead of `fetch`.

## Tooling & Environment

- Always use bun or bunx — never npm, yarn, pnpm, npx.

## Special Cases

- Use react-hook-form for all forms. Always use a top-level `defaultValues` prefilled with fake data or nothing according to `isDev` in `constants.ts`. Use `@hookform/resolvers/zod` for validation.
- For in-repository Expo plugins always use CommonJS (`require`, `module.exports`) and don't forget to put the `.ts` extension in `app.json`.
- When using the Directus SDK (post v11), call `createDirectus()` instead of using `new Directus()`.

## Additional Guidelines

- Never import from `@ficus-ui/core`; always import from `react-native-ficus-ui`.
- When using Ficus components, apply shorthands (`w`, `h`, etc.) and avoid `StyleSheet.create`.
- Define models/interfaces in `packages/models` if available.
- In general, routes/screens (returning JSX) should be as small as possible, avoiding particularly:
    - Schemas and validations code
    - useEffect and useCallback fetching logic
    - Util, helper, filtering, and most of logic functions
    - Large nested components like cells in lists (FlatList, FlashList, LegendList).
- Maximize usage of FlashList (use the one from Ficus if available in Expo/React Native).
- Always use lodash’s `isEmpty` for array length checks.
- Build controller-style hooks for react-query, with variable destructuring and smart renaming based on the REST action like: `const {isPending: isCreatingVenue, mutateAsync: createVenue} = useMutation({...`
- In frontend projects using strapi-js-sdk, use `strapi.request`, `strapi.login`, `strapi.create`, etc., and avoid axios/fetch unless specified.
- Prefer concise conditional expressions over if statements.
- Use optional chaining for null checks and assume lodash’s `isEmpty` handles empty, null, and undefined arrays.
- Extract lengthy helpers or converters into separate external files.
