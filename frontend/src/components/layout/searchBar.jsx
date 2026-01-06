import { useLocation, useNavigate } from 'react-router-dom';
import styles from './searchBar.module.css';

const Searchbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const query = params.get('search') || '';

  const handleChange = (e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(location.search);

    if (value.trim()) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }

    navigate(`/courses?${newParams.toString()}`, { replace: true });
  };

  return (
    <form className={styles.searchBar} onSubmit={(e) => e.preventDefault()}>
      <input
        type="search"
        placeholder="Search courses..."
        value={query}
        onChange={handleChange}
      />
    </form>
  );
};

export default Searchbar;
