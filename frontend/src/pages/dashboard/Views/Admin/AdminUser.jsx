import { useState, useEffect } from 'react';
import api from '../../../../services/api';
import styles from './adminDashboard.module.css';
import { DEFAULT_AVATAR } from '../../../../constants/media';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure? This will delete the user and all their data permanently.")) return;
        
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            alert("Failed to delete user. They might be an admin.");
        }
    };

    if (loading) return <div className={styles.stateCard}>Loading users...</div>;

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.userTable}>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>
                                <div className={styles.userCell}>
                                    <img 
                                        src={user.avatar || DEFAULT_AVATAR} 
                                        alt="avatar" 
                                        className={styles.miniAvatar}
                                    />
                                    <div>
                                        <div className={styles.userName}>{user.name}</div>
                                        <div className={styles.userEmail}>{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                {user.role !== 'admin' && (
                                    <button 
                                        onClick={() => handleDelete(user._id)} 
                                        className={styles.deleteBtn}
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUsers;