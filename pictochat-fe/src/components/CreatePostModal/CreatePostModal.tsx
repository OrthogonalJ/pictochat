import * as React from 'react';
import { Modal, Button, Loader, Dimmer } from 'semantic-ui-react';
import { useImage } from '../../hooks/ImageHooks';
import ImageDropzone from '../ImageDropzone';
import { useToggleModal } from '../../hooks/ModalHooks';
import NewPostPayload from '../../models/NewPostPayload';
import { DiscussionService } from '../../services/DiscussionService';
import './CreatePostModal.less';

interface CreatePostModalProps {
  buttonContent?: any;
  parentId?: string;
}

export default function CreatePostModal(props: CreatePostModalProps) {
  const { isActive, onOpen, onClose } = useToggleModal();
  const [isLoading, setLoading] = React.useState(false);
  const { image, base64, addNewImage, clearImage } = useImage({
    onSetImageDone: () => setLoading(false)
  });
  const handleImageUpload = (file: File) => {
    setLoading(true);
    addNewImage(file);
  };
  const handleClose = () => {
    clearImage();
    onClose();
  };
  const handleSubmit = async () => {
    setLoading(true);
    const user = { userId: '1' }; // getCurrentUser();
    const data: NewPostPayload = {
      userId: user.userId,
      parentId: props.parentId || null,
      image: image
    };
    await DiscussionService.createPost(data);
    setLoading(false);
    handleClose();
  };

  const renderDropzoneOrImg = () => {
    if (!!base64) return <img src={base64} />;
    return <ImageDropzone onImageUpload={handleImageUpload} />;
  };

  const renderModalTrigger = () => (
    <Button primary onClick={onOpen}>
      {props.buttonContent || 'Add Post'}
    </Button>
  );

  return (
    <Modal
      className="create-post-modal"
      trigger={renderModalTrigger()}
      open={isActive}
      onClose={handleClose}
      closeIcon={false}
    >
      <Modal.Header>Upload an Image</Modal.Header>
      <Modal.Content className="modal-content">{renderDropzoneOrImg()}</Modal.Content>
      <Modal.Actions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button primary onClick={handleSubmit}>
          Submit
        </Button>
      </Modal.Actions>
      <Dimmer inverted active={isLoading}>
        <Loader />
      </Dimmer>
    </Modal>
  );
}
