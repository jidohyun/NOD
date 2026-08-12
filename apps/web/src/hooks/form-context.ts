import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
// import { SelectField } from "@/components/form/select-field";
// import { SliderField } from "@/components/form/slider-field";
// import { SubmitButton } from "@/components/form/submit-button";
// import { SwitchField } from "@/components/form/switch-field";
// import { TagInputField } from "@/components/form/tag-input-field";
// import { TextField } from "@/components/form/text-field";
// import { TextareaField } from "@/components/form/textarea-field";

/**
 * Form contexts for TanStack Form
 * @see https://tanstack.com/form/latest/docs/framework/react/guides/form-composition
 *
 * This setup provides:
 * - Type-safe form state management across components
 * - Context-based field access without prop drilling
 * - Reusable form and field components
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

/**
 * Field components that can be used with form.ComponentName pattern
 * Add reusable field components here as the project grows
 *
 * @example
 * ```tsx
 * <form.AppField name="email">
 *   {(field) => <field.TextField label="Email" />}
 * </form.AppField>
 * ```
 */
const fieldComponents = {
  // SelectField,
  // SliderField,
  // SwitchField,
  // TagInputField,
  // TextareaField,
  // TextField,
};

/**
 * Form-level components that can be used with form.ComponentName pattern
 * These components have access to the entire form state via useFormContext
 *
 * @example
 * ```tsx
 * <form.AppForm>
 *   <form.SubmitButton label="Save" loadingLabel="Saving..." />
 * </form.AppForm>
 * ```
 */
const formComponents = {
  // SubmitButton,
};

/**
 * Custom form hook and HOC for the application
 *
 * ## useAppForm
 * Create a form instance with pre-configured contexts
 *
 * ```tsx
 * const form = useAppForm({
 *   defaultValues: { name: '', email: '' },
 *   onSubmit: ({ value }) => console.log(value),
 * });
 *
 * return (
 *   <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
 *     <form.Field name="name">
 *       {(field) => <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />}
 *     </form.Field>
 *     <form.AppForm>
 *       <form.SubmitButton label="Save" />
 *     </form.AppForm>
 *   </form>
 * );
 * ```
 *
 * ## withForm
 * HOC for composing form sub-components with type inference.
 * Useful for breaking down large forms into smaller, focused components.
 *
 * ```tsx
 * const IngredientSection = withForm({
 *   defaultValues: {
 *     ingredients: [] as FormIngredient[],
 *   },
 *   props: {
 *     sectionTitle: 'Ingredients',
 *   },
 *   render: function Render({ form, sectionTitle }) {
 *     return (
 *       <div>
 *         <h2>{sectionTitle}</h2>
 *         <form.Field name="ingredients">
 *           {(field) => <IngredientList field={field} />}
 *         </form.Field>
 *       </div>
 *     );
 *   },
 * });
 *
 * // In parent component:
 * const form = useAppForm({ defaultValues: { ingredients: [], steps: [] } });
 * return <IngredientSection form={form} sectionTitle="재료" />;
 * ```
 */
export const { useAppForm, withForm } = createFormHook({
  fieldComponents,
  fieldContext,
  formComponents,
  formContext,
});

// Re-export types for convenience
export type { FieldApi, FormApi } from "@tanstack/react-form";
