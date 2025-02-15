import * as React from 'react';
import * as EmailValidator from 'email-validator';
import { Form, Button } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import StoresContext from '../../../contexts/StoresContext';
import UnauthenticatedUser from '../../../models/UnauthenticatedUser';
import useForm from 'react-hook-form';
import { handleError } from '../../../utils/ErrorHelpers';
import './RegisterForm.less';

interface RegisterFormProps {
  /**
   * Callback function that executes when the cancel button is clicked
   * @function
   */
  onCancelClick?: () => void;
  /**
   * Callback function that executes when a user has registered successfully
   * @function
   */
  onSubmitSuccess?: () => void;
}

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
  retryPassword: string;
};

/**
 * A React component that Provides a form to register a user
 * @param { RegisterFormProps } props - The props of the component
 */
export function RegisterForm(props: RegisterFormProps) {
  /* STORES */
  const authStore = React.useContext(StoresContext).auth;

  /* HOOKS */
  const { handleSubmit, register, reset } = useForm<RegisterFormData>();

  /* HELPERS  */
  const onlyLettersAndNumbers = (str: string): boolean => {
    return /^[A-Za-z0-9]+$/.test(str);
  };

  const validateForm = ({ username, email, password, retryPassword }: RegisterFormData) => {
    if (!username || !email || !password) {
      throw new Error('One or more required fields are empty!');
    }
    if (retryPassword !== password) {
      throw new Error('Passwords do not match!');
    }
    if (!EmailValidator.validate(email)) {
      throw new Error('Email is not valid!');
    }
    if (!onlyLettersAndNumbers(username)) {
      throw new Error('Username must only contain letters and numbers!');
    }
  };

  /* EVENT HANDLERS */
  const onSubmit = handleSubmit(async formData => {
    try {
      validateForm(formData);
      const userJson: UnauthenticatedUser = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      await authStore.createUserAndAuth(userJson); // assuming an error is thrown if creation failed - Jordan
      alert('User created sucessfully');
      props.onSubmitSuccess && props.onSubmitSuccess();
    } catch (e) {
      handleError(e);
    }
  });

  const handleCancelClick = (event: React.SyntheticEvent<any>) => {
    event.preventDefault();
    reset();
    props.onCancelClick && props.onCancelClick();
  };

  /* RENDERING */
  return (
    <Form id="register-form" onSubmit={onSubmit} method="POST">
      <h1>Create an Account</h1>
      <Form.Field className="register-field-username">
        <label>Username</label>
        <input name="username" type="text" ref={register} />
      </Form.Field>
      <Form.Field className="register-field-email">
        <label>Email</label>
        <input name="email" type="text" ref={register} />
      </Form.Field>
      <Form.Field className="register-field-password">
        <label>Password</label>
        <input name="password" type="password" ref={register} />
      </Form.Field>
      <Form.Field className="register-field-retry-password">
        <label>Re-type Password</label>
        <input name="retryPassword" type="password" ref={register} />
      </Form.Field>
      <Form.Group className="register-actions">
        <Form.Field className="cancel-button">
          <Button type="button" onClick={handleCancelClick}>
            Cancel
          </Button>
        </Form.Field>
        <Form.Field className="register-button">
          <Button primary type="submit">
            Sign Up
          </Button>
        </Form.Field>
      </Form.Group>
    </Form>
  );
}

export default observer(RegisterForm);
