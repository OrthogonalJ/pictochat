import * as React from 'react';
import SignUp from '../../components/SignUp';
import './RegisterPage.less';
import { RouteComponentProps } from 'react-router';

interface RegisterPageProps extends RouteComponentProps<any> {}

export default function RegisterPage(props: RegisterPageProps) {
  const handleCancelClick = React.useCallback(() => {
    props.history.goBack();
  }, []);

  const handleSubmitSuccess = React.useCallback(() => {
    props.history.goBack();
  }, []);

  return (
    <section id="register-page">
      <SignUp onCancelClick={handleCancelClick} onSubmitSuccess={handleSubmitSuccess} />
    </section>
  );
}
