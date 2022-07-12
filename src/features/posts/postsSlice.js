import { createSlice, createAsyncThunk, createSelector, createEntityAdapter } from '@reduxjs/toolkit';
import { sub } from 'date-fns';
import axios from 'axios';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';


const postAdapter = createEntityAdapter({ sortComparer: (a, b) => b.date.localeCompare(a.date) });

const initialState = postAdapter.getInitialState({
	status: 'idle', //'idle' | 'loading' | 'succeeded' | 'failed'
	error: null,
	count: 0,
});

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
	const response = await axios.get(POSTS_URL);
	return response.data;
});

export const addNewPost = createAsyncThunk('posts/addNewPost', async (initialPost) => {
	const response = await axios.post(POSTS_URL, initialPost);
	return response.data;
});

export const updatePost = createAsyncThunk('posts/updatePost', async (initialPost) => {
	const { id } = initialPost;
	try {
		const response = await axios.put(`${POSTS_URL}/${id}`, initialPost);
		return response.data;
	} catch (err) {
		//return err.message;
		return initialPost; // only for testing Redux!
	}
});

export const deletePost = createAsyncThunk('posts/deletePost', async (initialPost) => {
	const { id } = initialPost;
	try {
		const response = await axios.delete(`${POSTS_URL}/${id}`);
		if (response?.status === 200) return initialPost;
		return `${response?.status}: ${response?.statusText}`;
	} catch (err) {
		return err.message;
	}
});

const postsSlice = createSlice({
	name: 'posts',
	initialState,
	reducers: {
		reactionAdded(state, action) {
			const { postId, reaction } = action.payload;
			const existingPost = state.entities[postId];
			if (existingPost) {
				existingPost.reactions[reaction]++;
			}
		},
		increaseCount(state, action) {
			state.count = state.count + 1;
		},
	},
	extraReducers(builder) {
		builder
			.addCase(fetchPosts.pending, (state, action) => {
				state.status = 'loading';
			})
			.addCase(fetchPosts.fulfilled, (state, action) => {
				state.status = 'succeeded';
				// Adding date and reactions
				let min = 1;
				const loadedPosts = action.payload.map((post) => {
					post.date = sub(new Date(), { minutes: min++ }).toISOString();
					post.reactions = {
						thumbsUp: 0,
						wow: 0,
						heart: 0,
						rocket: 0,
						coffee: 0,
					};
					return post;
				});

				// Add any fetched posts to the array
				// state.posts = state.posts.concat(loadedPosts);
				postAdapter.upsertMany(state, loadedPosts);
			})
			.addCase(fetchPosts.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.error.message;
			})
			.addCase(addNewPost.fulfilled, (state, action) => {
				action.payload.userId = Number(action.payload.userId);
				action.payload.date = new Date().toISOString();
				action.payload.reactions = {
					thumbsUp: 0,
					wow: 0,
					heart: 0,
					rocket: 0,
					coffee: 0,
				};
				console.log(action.payload);
				// state.posts.push(action.payload);
				postAdapter.addOne(state, action.payload);
			})
			.addCase(updatePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log('Update could not complete');
					console.log(action.payload);
					return;
				}
				action.payload.date = new Date().toISOString();
				// const { id } = action.payload;
				// const posts = state.posts.filter((post) => post.id !== id);
				// state.posts = [...posts, action.payload];
				postAdapter.upsertOne(state, action.payload);
			})
			.addCase(deletePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log('Delete could not complete');
					console.log(action.payload);
					return;
				}
				const { id } = action.payload;
				// const posts = state.posts.filter((post) => post.id !== id);
				// state.posts = posts;
				postAdapter.removeOne(state, id);
			});
	},
});

// export const selectAllPosts = (state) => state.posts.posts;
// export const selectPostById = (state, postId) => state.posts.posts.find((post) => post.id === postId);
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;
export const getCount = (state) => state.posts.count;

//getSelectors creates this selectors and we rename them as we need
export const {
	selectAll: selectAllPosts,
	selectById: selectPostById,
	selectIds: selectPostIds,
} = postAdapter.getSelectors((state) => state.posts);

//!Memoized selector
export const selectPostsByUser = createSelector([selectAllPosts, (state, userId) => userId], (posts, userId) =>
	posts.filter((post) => post.userId === userId)
);

export const { reactionAdded, increaseCount } = postsSlice.actions;

export default postsSlice.reducer;
