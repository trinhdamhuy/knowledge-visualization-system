enum RegisterErrors {
  email_already_in_use = "This email is already in use.",
  fields_required = "Please complete all fields.",
  password_confirmation_required = "Please confirm your password.",
  password_confirmation_mismatch = "The passwords do not match.",
  password_strength_required = "The password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
  password_strength_mismatch = "The password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
}

enum LoginErrors {
  email_not_verified = "This email is not verified.",
  password_incorrect = "Your password is incorrect.",
}

enum PasswordChangeErrors {
  fields_required = "Please complete all fields.",
  google_login_only = "Since you are logged in with Google, it is impossible to change your password.",
  password_incorrect = "Your current password is incorrect.",
  password_same = "Your new password must be different from your current password.",
  password_change_error = "An error occurred while changing your password.",
}

export { RegisterErrors, LoginErrors, PasswordChangeErrors };
