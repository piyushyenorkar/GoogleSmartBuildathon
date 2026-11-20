export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'number' 
  | 'url'

export interface FormField {
  id: string
  label: string
  placeholder?: string
  helpText?: string
  type: FormFieldType
  required: boolean
  options?: string[] // For select, radio, checkbox
}

export interface CustomFormConfig {
  id?: string
  title: string
  description?: string
  purpose?: string // Explanation of why this form was created / what it's used for
  fields: FormField[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface FormResponseData {
  form_id?: string
  competition_id: string
  team_id?: string
  user_id: string
  submitted_by_name?: string
  submitted_by_email?: string
  submitted_at: string
  answers: Record<string, any> // fieldId -> answer value
}
