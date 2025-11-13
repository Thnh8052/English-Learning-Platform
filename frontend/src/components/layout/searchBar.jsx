import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './searchBar.module.css';

const Searchbar = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            // Điều hướng đến trang /courses với query tìm kiếm
            navigate(`/courses?search=${encodeURIComponent(query)}`);
            setQuery(''); // Xóa nội dung sau khi tìm kiếm
        }
    };

    return (
        <form onSubmit={handleSearch} className={styles.searchBar}>
            <input
                type="search"
                placeholder="Search courses..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {}
        </form>
    );
};

export default Searchbar;