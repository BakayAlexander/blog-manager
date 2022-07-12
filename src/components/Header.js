import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getCount, increaseCount } from '../features/posts/postsSlice';

const Header = () => {
	const dispatch = useDispatch();
	const count = useSelector(getCount);
	return (
		<header className='Header'>
			<h1>Redux Blog</h1>
			<nav>
				<ul>
					<li>
						<Link to='/'>Home</Link>
					</li>
					<li>
						<Link to='post'>Post</Link>
					</li>
					<li>
						<Link to='users'>Users</Link>
					</li>
				</ul>
				<button
					onClick={() => dispatch(increaseCount())}
					style={{ width: '30px', border: '1px solid', backgroundColor: 'transparent' }}
				>
					{count}
				</button>
			</nav>
		</header>
	);
};

export default Header;
