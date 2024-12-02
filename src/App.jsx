

import React, { useState, useEffect } from 'react';
import { UserIcon, CogIcon, TrashIcon, EditIcon, LogOutIcon } from 'lucide-react';

const HARDCODED_CREDENTIALS = [
  { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@example.com', status: 'Active' },
  { username: 'editor', password: 'editor123', role: 'editor', email: 'editor@example.com', status: 'Active' },
  { username: 'user', password: 'user123', role: 'user', email: 'user@example.com', status: 'Active' }
];

const DEFAULT_PERMISSIONS = {
  read: false,
  write: false,
  delete: false,
  admin: false
};

const AuthContext = React.createContext(null);

const App = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');

    if (storedUsers.length === 0) {
      const initialUsers = [...HARDCODED_CREDENTIALS];
      setUsers(initialUsers);
      localStorage.setItem('users', JSON.stringify(initialUsers));
    } else {
      setUsers(storedUsers);
    }

    // Initialize default roles if no roles exist
    if (storedRoles.length === 0) {
      const initialRoles = [
        { id: 1, name: 'admin', permissions: { read: true, write: true, delete: true, admin: true } },
        { id: 2, name: 'editor', permissions: { read: true, write: true, delete: false, admin: false } },
        { id: 3, name: 'user', permissions: { read: true, write: false, delete: false, admin: false } }
      ];
      setRoles(initialRoles);
      localStorage.setItem('roles', JSON.stringify(initialRoles));
    } else {
      setRoles(storedRoles);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('roles', JSON.stringify(roles));
  }, [roles]);

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = (username, password, email, role) => {
    if (users.some(u => u.username === username)) {
      return false;
    }
    const newUser = {
      id: Date.now(),
      username,
      password,
      email,
      role,
      status: 'Active'
    };
    setUsers([...users, newUser]);
    return true;
  };

  const addRole = (name, permissions) => {
    const newRole = {
      id: Date.now(),
      name,
      permissions
    };
    setRoles([...roles, newRole]);
  };

  const updateRole = (id, updatedRole) => {
    setRoles(roles.map(role =>
      role.id === id ? { ...role, ...updatedRole } : role
    ));
  };

  const deleteRole = (id) => {
    // Prevent deletion of default roles
    if ([1, 2, 3].includes(id)) {
      alert('Cannot delete default roles');
      return;
    }
    setRoles(roles.filter(role => role.id !== id));
  };

  const updateUser = (id, updatedUser) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, ...updatedUser } : user
    ));
  };

  const deleteUser = (id) => {
    // Prevent deletion of hardcoded users
    const hardcodedUsernames = HARDCODED_CREDENTIALS.map(u => u.username);
    const userToDelete = users.find(u => u.id === id);

    if (hardcodedUsernames.includes(userToDelete.username)) {
      alert('Cannot delete default users');
      return;
    }

    setUsers(users.filter(user => user.id !== id));
  };

  const renderDashboardContent = () => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'editor') {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You do not have permission to access this dashboard.</p>
        </div>
      );
    }
    if (currentUser.role === 'editor') {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Editor Dashboard</h2>
          <p className='mb-5'>Welcome, {currentUser.username}!</p>
          {currentUser.role === "Editor" ? <RoleManagement
            roles={roles}
            onAddRole={addRole}
            onUpdateRole={updateRole}
            onDeleteRole={deleteRole}
          /> : <UserManagement
            users={users}
            roles={roles}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />}


        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserManagement
          users={users}
          roles={roles}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
        />
        <RoleManagement
          roles={roles}
          onAddRole={addRole}
          onUpdateRole={updateRole}
          onDeleteRole={deleteRole}
        />
      </div>
    );
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register }}>
      <div className="min-h-screen bg-blue-100 p-8">
        {!currentUser ? (
          <AuthenticationPage />
        ) : (
          <div>
            <div className="flex justify-between p-2 px-5 rounded-lg items-center mb-6 bg-blue-200">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <button
                onClick={logout}
                className="bg-red-500 text-white p-2 rounded flex items-center hover:bg-red-600"
              >
                <LogOutIcon className="mr-2" size={16} /> Logout
              </button>
            </div>
            {renderDashboardContent()}
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
};

const RoleManagement = ({ roles, onAddRole, onUpdateRole, onDeleteRole }) => {
  const [newRole, setNewRole] = useState({ name: '', permissions: { ...DEFAULT_PERMISSIONS } });
  const [editingRole, setEditingRole] = useState(null);

  const handlePermissionChange = (permission) => {
    const updatedPermissions = editingRole
      ? { ...editingRole.permissions, [permission]: !editingRole.permissions[permission] }
      : { ...newRole.permissions, [permission]: !newRole.permissions[permission] };

    if (editingRole) {
      setEditingRole({ ...editingRole, permissions: updatedPermissions });
    } else {
      setNewRole({ ...newRole, permissions: updatedPermissions });
    }
  };

  const handleSaveRole = () => {
    if (editingRole) {
      onUpdateRole(editingRole.id, editingRole);
      setEditingRole(null);
    } else {
      onAddRole(newRole.name, newRole.permissions);
      setNewRole({ name: '', permissions: { ...DEFAULT_PERMISSIONS } });
    }
  };

  return (
    <div className="bg-cyan-100/40 backdrop-blur-2xl p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <CogIcon className="mr-2" /> Role Management
      </h2>
      <div className="space-y-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Role Name"
            value={editingRole ? editingRole.name : newRole.name}
            onChange={(e) =>
              editingRole
                ? setEditingRole({ ...editingRole, name: e.target.value })
                : setNewRole({ ...newRole, name: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.keys(DEFAULT_PERMISSIONS).map(permission => (
            <div key={permission} className="flex items-center">
              <input
                type="checkbox"
                id={permission}
                checked={
                  editingRole
                    ? editingRole.permissions[permission]
                    : newRole.permissions[permission]
                }
                onChange={() => handlePermissionChange(permission)}
                className="mr-2"
              />
              <label htmlFor={permission} className="capitalize">
                {permission}
              </label>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSaveRole}
            className="bg-green-500 text-white p-2 rounded flex-grow hover:bg-green-600"
          >
            {editingRole ? 'Update Role' : 'Add Role'}
          </button>
          {editingRole && (
            <button
              onClick={() => setEditingRole(null)}
              className="bg-gray-300 text-black p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Existing Roles</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Role Name</th>
              <th className="p-2 text-left">Permissions</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="border-b">
                <td className="p-2">{role.name}</td>
                <td className="p-2">
                  {Object.entries(role.permissions)
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                    .join(', ')}
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="mr-2 text-blue-500 hover:text-blue-700"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteRole(role.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserManagement = ({ users, roles, onUpdateUser, onDeleteUser }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleEditUser = (user) => {
    setSelectedUser(user);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      onUpdateUser(selectedUser.id, selectedUser);
      setSelectedUser(null);
    }
  };

  return (
    <div className="bg-cyan-100/40 backdrop-blur-2xl p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <UserIcon className="mr-2" /> User Management
      </h2>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200/50 rounded-lg ">
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b">
              <td className="p-2">{user.username}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">{user.status}</td>
              <td className="p-2 text-right">
                <button
                  onClick={() => handleEditUser(user)}
                  className="mr-2 text-blue-500 hover:text-blue-700"
                >
                  <EditIcon size={16} />
                </button>
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Edit User</h3>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={selectedUser.role}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              className="p-2 border rounded"
            >
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
            <select
              value={selectedUser.status}
              onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button
              onClick={handleSaveUser}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Save Changes
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="bg-gray-300 text-black p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthenticationPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const { login, register } = React.useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      if (!login(username, password)) {
        alert('Invalid credentials');
      }
    } else {
      if (register(username, password, email, role)) {
        setIsLogin(true);
      } else {
        alert('Registration failed. Username might already exist.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-10 justify-center rounded-3xl items-center min-h-screen bg-blue-200/50 backdrop-blur-2xl">
      <div className="bg-blue-50 p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          {!isLogin && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Role</option>
                <option value="user">User</option>
                <option value="editor">Editor</option>
              </select>
            </>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>

      <div className='flex flex-col justify-center items-center gap-5 bg-blue-50/40 p-8 rounded-lg shadow-md'>
        <h2 className='text-xl'>Saved Logins</h2>
        <div>
          <table  className="w-full">
            <thead>
              <tr className="bg-gray-200/50 rounded-lg text-center">
                <th className="p-2 ">Username</th>
                <th className="p-2 ">Password</th>
                <th className="p-2 ">Email</th>
                <th className="p-2 ">Role</th>
              </tr>
            </thead>
            <tbody>
              {HARDCODED_CREDENTIALS.map((user) => (
                <tr key={user.username} className="border-b">
                  <td className="p-2" >{user.username}</td>
                  <td className="p-2">{user.password}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2" >{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
};

export default App;