import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';
import { ITask } from './Task';

export interface IComment extends Document {
  content: string;
  task: ITask['_id'];
  author: IUser['_id'];
  parentComment?: IComment['_id'];
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
}, {
  timestamps: true,
});

const Comment = model<IComment>('Comment', commentSchema);

export default Comment;
