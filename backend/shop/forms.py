from django import forms
from django.contrib.auth.models import User


class CheckoutForm(forms.Form):

    customer_name = forms.CharField(
        max_length=200,
        label="Name"
    )

    phone = forms.CharField(
        max_length=10,
        min_length=10,
        label="Phone"
    )

    address = forms.CharField(
        widget=forms.Textarea,
        label="Address"
    )

    def clean_phone(self):
        phone = self.cleaned_data["phone"]

        if not phone.isdigit():
            raise forms.ValidationError(
                "Phone number must contain only digits."
            )

        if not phone.startswith(("6", "7", "8", "9")):
            raise forms.ValidationError(
                "Enter a valid Indian mobile number."
            )

        return phone


class RegisterForm(forms.ModelForm):

    password = forms.CharField(
        widget=forms.PasswordInput,
        label="Password"
    )

    password_confirm = forms.CharField(
        widget=forms.PasswordInput,
        label="Confirm Password"
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
        ]

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm:
            if password != password_confirm:
                raise forms.ValidationError(
                    "Passwords do not match."
                )

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)

        user.set_password(
            self.cleaned_data["password"]
        )

        if commit:
            user.save()

        return user