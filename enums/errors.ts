enum SignUpErrors {
  email_already_in_use = "This email is already in use.",
  fields_required = "Please complete all fields.",
}

enum PasswordChangeErrors {
  fields_required = "Please complete all fields.",
  google_login_only = "Since you are logged in with Google, it is impossible to change your password.",
  password_incorrect = "Your current password is incorrect.",
  password_same = "Your new password must be different from your current password.",
  password_change_error = "An error occurred while changing your password.",
}

export { SignUpErrors, PasswordChangeErrors };
