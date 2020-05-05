import * as React from 'react';
import {
    Stack,
    PrimaryButton,
    TextField,
    Icon,
    Spinner,
    SpinnerSize
} from 'office-ui-fabric-react/lib';
import { Dialog } from '@microsoft/sp-dialog'
import * as strings from 'AmazonReviewsCommandSetStrings'
import styles from './predict.module.scss'
import IPredictProps from './predict-props';
import IPredictState from './predict-state';
import Encoder from '../encoder/encoder'

export default class Predict extends React.Component<IPredictProps, IPredictState> {
    public state: IPredictState = {
        result: [],
        comment: '',
        encoderLoaded: false,
        training: false,
        trained: false,
        process: false
    };

    private encoder: Encoder

    constructor(props: IPredictProps) {
        super(props);
        this.loadEncoder();
    }

    public render(): JSX.Element {
        const { result, encoderLoaded, training, trained, process } = this.state;

        return (
            <div>
                {
                    !encoderLoaded
                        ? <Spinner size={SpinnerSize.large} label={strings.waitEncoder} />
                        :
                        <span>
                            {
                                !trained &&
                                <Stack horizontal horizontalAlign="center">
                                    {
                                        training
                                            ? <Spinner size={SpinnerSize.large} label={strings.waitTraining} />
                                            :
                                            <PrimaryButton
                                                onClick={this.train}
                                                text={strings.train} />
                                    }
                                </Stack>
                            }
                        </span>
                }
                {
                    result.map(({ value, similarReview, similarReviewScore, rating, probability }) =>
                        <div style={{ margin: '7px' }}>
                            <Stack horizontal horizontalAlign="end">
                                {
                                    rating === 1
                                        ? <Icon iconName='LikeSolid' className={styles.icon} />
                                        : <Icon iconName='DislikeSolid' className={styles.icon} />
                                }
                                &nbsp;(<b>{this.format(probability)}</b>)
                            </Stack>
                            <Stack horizontal horizontalAlign="center">
                                <TextField
                                    readOnly
                                    value={value}
                                    styles={{ fieldGroup: { width: 482 } }}
                                />
                            </Stack>
                            <Stack horizontal horizontalAlign="center">
                                {similarReview}&nbsp;(<b>{this.format(similarReviewScore)}</b>)
                            </Stack>
                            <hr />
                        </div>)
                }
                {
                    encoderLoaded && trained &&
                    <span>
                        <Stack horizontal horizontalAlign="center">
                            <TextField
                                placeholder={strings.enterComment}
                                required
                                value={this.state.comment}
                                onChange={(e, comment) =>
                                    this.setState({ comment })
                                }
                                styles={{ fieldGroup: { width: 482 } }}
                            />
                        </Stack>
                        <Stack horizontal horizontalAlign="center">
                            {
                                process
                                    ?
                                    <div style={{ marginTop: '4px' }}>
                                        <Spinner size={SpinnerSize.large} label={strings.waitAddingComment} />
                                    </div>
                                    :
                                    <div className={styles.button}>
                                        <PrimaryButton
                                            onClick={this.addComment}
                                            text={strings.addComment}
                                        />
                                    </div>
                            }
                        </Stack>
                    </span>
                }
            </div >
        )
    }

    private format = (val: number) => `${(val * 100).toFixed(2)}%`

    private loadEncoder = () => {
        this.encoder = new Encoder()

        this.encoder.load()
            .then(() => {
                this.setState({ encoderLoaded: true })
                this.encoder.trainedModel()
                    .then(trained => {
                        if (trained) {
                            this.setState({ trained: true })
                        }
                    })
                    .catch(this.displayError)
            })
            .catch(this.displayError)
    }

    private train = async () => {
        this.setState({ training: true })
        try {
            await this.encoder.train(this.props.data)
            this.setState({ training: false, trained: true })
        } catch (e) {
            this.displayError(e)
        }
    }

    private addComment = async () => {
        const { comment, result } = this.state

        if (comment.trim()) {
            this.setState({ process: true })
            try {
                const { probability, rating, similarReview, similarReviewScore } = await this.encoder.process(this.props.data, comment)

                result.push({ value: comment, probability, rating, similarReview, similarReviewScore });
                this.setState({ result, comment: '', process: false });
            } catch (e) {
                this.displayError(e)
            }
        }
    }

    private displayError = (e: any) => {
        this.setState({ encoderLoaded: false, training: false, trained: false, process: false })
        this.props.onDismiss()
        Dialog.alert(e.message)
    }
}