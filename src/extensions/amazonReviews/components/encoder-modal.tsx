import * as React from 'react'
import * as strings from 'AmazonReviewsCommandSetStrings'
import styles from './encoder-modal.module.scss'
import {
    MessageBar,
    MessageBarType,
    Icon,
    Modal,
    Spinner,
    SpinnerSize
} from 'office-ui-fabric-react/lib';
import IEncoderModalProps from './encoder-modal-props';
import IEncoderModalState from './encoder-modal-state';
import ListService from '../services/list-service';
import Encoder from './predict';

export default class EncoderModal extends React.Component<IEncoderModalProps, IEncoderModalState> {
    public state: IEncoderModalState = {
        data: [],
        fields: [],
        error: ''
    };

    private listService: ListService;

    constructor(props: IEncoderModalProps) {
        super(props);
        this.listService = new ListService();
    }

    public async componentDidMount() {
        const { listId } = this.props

        const fields: Promise<any> = this.listService.getListFields(listId)
        const data: Promise<any> = this.listService.getList(listId)

        return Promise.all([fields, data])
            .then(([f, d]) => this.setState({ fields: f, data: d }))
            .catch(e => this.setState({ error: e.message }));
    }

    public render(): JSX.Element {
        const { fields, data, error } = this.state;

        return (
            <div>
                {error ?
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                        onDismiss={this.closeMessageBar}
                        dismissButtonAriaLabel={strings.close}>
                        {error}
                    </MessageBar>
                    : <Modal
                        isOpen={true}
                        isBlocking={true}
                        onDismiss={this.closeModal}
                    > <div>
                            <div className={styles.header}>
                                <span>{strings.header}</span>
                                <span style={{ fontSize: '13px' }}> ({strings.subheader})</span>
                                <div className={styles.close} onClick={this.closeModal}>
                                    <Icon iconName="ChromeClose" style={{ cursor: 'pointer' }} /></div>
                            </div>
                            <div className={styles.modal}>
                                <div>
                                    {data.length === 0
                                        ? <Spinner size={SpinnerSize.large} label={strings.waitData} />
                                        : <Encoder fields={fields} data={data} onDismiss={this.closeModal} />
                                    }
                                </div>
                            </div>
                        </div>
                    </Modal>
                }
            </div>
        );
    }

    private closeMessageBar = (): void => this.setState({ error: '' });

    private closeModal = (): void => this.props.onDismiss();
}