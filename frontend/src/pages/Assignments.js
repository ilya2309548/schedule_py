import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiUsers, FiFileText, FiCalendar, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import { assignmentsService, groupsService } from '../services/apiServices';

const AssignmentsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const AssignmentsHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Title = styled.h1`
  color: ${COLORS.primary};
  font-size: 32px;
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: ${COLORS.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${COLORS.primaryDark};
  }
`;

const AssignmentGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const AssignmentCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const AssignmentTitle = styled.h3`
  color: ${COLORS.text};
  font-size: 20px;
  margin: 0 0 16px 0;
`;

const AssignmentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  font-size: 14px;
`;

const AssignmentDescription = styled.p`
  color: ${COLORS.text};
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const AssignmentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.danger ? COLORS.danger : COLORS.light};
  color: ${props => props.danger ? 'white' : COLORS.text};
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.danger ? COLORS.dangerDark : COLORS.accent};
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${COLORS.textSecondary};
  background-color: ${COLORS.gray};
  border-radius: 8px;
  font-size: 16px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &:after {
    content: '';
    width: 32px;
    height: 32px;
    border: 4px solid ${COLORS.light};
    border-top-color: ${COLORS.primary};
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
  }
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Modal components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${COLORS.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${COLORS.textSecondary};
  
  &:hover {
    color: ${COLORS.text};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${COLORS.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 6px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 6px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 6px;
  font-size: 16px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
  }
`;

const SubmitButton = styled.button`
  background-color: ${COLORS.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${COLORS.primaryDark};
  }
  
  &:disabled {
    background-color: ${COLORS.darkGray};
    cursor: not-allowed;
  }
`;

const InfoMessage = styled.div`
  padding: 12px 16px;
  margin-bottom: 20px;
  background-color: #e6f7ff;
  border-left: 4px solid #1890ff;
  color: rgba(0, 0, 0, 0.85);
  border-radius: 4px;
  font-size: 14px;
`;

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    deadline: '',
    group_id: '',
    teacher_id: '',
    teacher_name: ''
  });
  const [groups, setGroups] = useState([]);
  
  // Effect to load user data when component mounts
  useEffect(() => {
    // Get user data from localStorage or context
    try {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : {};
      setUserRole(user.role || 'STUDENT');
      setUserId(user.id || null);
      
      fetchAssignments();
      fetchGroups();
    } catch (error) {
      console.error('Error parsing user data:', error);
      setError('Ошибка при загрузке данных пользователя');
    }
  }, []);
  
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentsService.getAssignments();
      console.log('Полученные задания:', data);
      
      // Дополнительно проверяем и дополняем данные, если не были обработаны на уровне сервиса
      const processedData = data.map(assignment => {
        // Создаем копию задания
        const processedAssignment = { ...assignment };
        
        // Устанавливаем информацию о преподавателе, если ее по-прежнему нет
        if (!processedAssignment.teacher_name && userRole === 'TEACHER' && processedAssignment.teacher_id === userId) {
          try {
            const userString = localStorage.getItem('user');
            if (userString) {
              const user = JSON.parse(userString);
              processedAssignment.teacher_name = user.full_name || user.username || 'Текущий пользователь';
            }
          } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
          }
        }
        
        return processedAssignment;
      });
      
      setAssignments(processedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Не удалось загрузить задания. Пожалуйста, попробуйте позже.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      const data = await groupsService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Fallback to empty groups array
      setGroups([]);
    }
  };
  
  const handleCreateClick = () => {
    setEditingAssignment(null);
    
    // Get tomorrow's date for default deadline
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    
    // Получаем информацию о текущем пользователе
    try {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : {};
      
      // Определяем имя преподавателя
      let teacherName = '';
      if (user.full_name) {
        teacherName = user.full_name;
      } else if (user.username) {
        teacherName = user.username;
      } else if (user.email) {
        teacherName = user.email.split('@')[0]; // Используем первую часть email в крайнем случае
      }
      
      console.log('Данные пользователя для создания задания:', {
        id: user.id,
        role: user.role,
        teacherName: teacherName
      });
      
      setFormData({
        title: '',
        description: '',
        due_date: formattedDate,
        deadline: formattedDate,
        group_id: '',
        teacher_id: user.id || '',
        teacher_name: teacherName
      });
    } catch (error) {
      console.error('Error getting user data:', error);
      setFormData({
        title: '',
        description: '',
        due_date: formattedDate,
        deadline: formattedDate,
        group_id: ''
      });
    }
    
    setShowModal(true);
  };
  
  const handleEditClick = (assignment) => {
    setEditingAssignment(assignment);
    
    // Format the date for the input field (YYYY-MM-DD)
    const formattedDate = assignment.deadline || assignment.due_date ? 
      new Date(assignment.deadline || assignment.due_date).toISOString().split('T')[0] : '';
    
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      due_date: formattedDate,
      deadline: formattedDate,
      group_id: assignment.group_id || '',
      teacher_id: assignment.teacher_id || userId || '',
      teacher_name: assignment.teacher_name || ''
    });
    setShowModal(true);
  };
  
  const handleDeleteClick = async (assignmentId) => {
    if (window.confirm('Вы уверены, что хотите удалить это задание?')) {
      try {
        await assignmentsService.deleteAssignment(assignmentId);
        setAssignments(assignments.filter(a => a.id !== assignmentId));
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Не удалось удалить задание. Пожалуйста, попробуйте позже.');
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setSaveStatus('saving');
      
      // Преобразование даты в нужный формат
      let formattedData = { ...formData };
      
      // Получаем информацию о пользователе, если не задана
      if (!formattedData.teacher_id || !formattedData.teacher_name) {
        try {
          const userString = localStorage.getItem('user');
          if (userString) {
            const user = JSON.parse(userString);
            
            if (!formattedData.teacher_id && user.id) {
              formattedData.teacher_id = user.id;
            }
            
            if (!formattedData.teacher_name) {
              if (user.full_name) {
                formattedData.teacher_name = user.full_name;
              } else if (user.username) {
                formattedData.teacher_name = user.username;
              } else if (user.email) {
                formattedData.teacher_name = user.email.split('@')[0];
              }
            }
          }
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
        }
      }
      
      // Создаем объект assignment с необходимыми данными
      const assignmentData = {
        ...formattedData,
        teacher_id: formattedData.teacher_id || userId // Use the current user ID for the teacher
      };
      
      let updatedAssignment;
      
      if (editingAssignment) {
        // Update existing assignment
        updatedAssignment = await assignmentsService.updateAssignment(
          editingAssignment.id, 
          assignmentData
        );
        
        setAssignments(assignments.map(a => 
          a.id === editingAssignment.id ? updatedAssignment : a
        ));
        
        setSaveStatus('success');
      } else {
        // Create new assignment
        const newAssignment = await assignmentsService.createAssignment(assignmentData);
        
        // Проверяем, что новое задание содержит все необходимые данные
        console.log('Получено новое задание:', newAssignment);
        
        setAssignments([...assignments, newAssignment]);
        setSaveStatus('success');
      }
      
      // Показываем статус успешного сохранения на 1.5 секунды
      setTimeout(() => {
        setSaveStatus(null);
        setShowModal(false);
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving assignment:', error);
      setLoading(false);
      setSaveStatus('error');
      alert('Не удалось сохранить задание. Пожалуйста, проверьте введенные данные.');
    }
  };
  
  // Filter assignments based on user role
  const filteredAssignments = assignments.filter(assignment => {
    try {
      if (userRole && userRole.toUpperCase() === 'TEACHER') {
        // Teachers see only their own assignments
        return assignment.teacher_id === userId;
      } else {
        // Students can see assignments for their group
        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : {};
        const studentGroupId = user.group_id;
        
        // If no group_id is available, show all assignments to prevent empty screen
        if (!studentGroupId) return true;
        
        return assignment.group_id === studentGroupId;
      }
    } catch (error) {
      console.error('Error filtering assignments:', error);
      // Return true to show all assignments in case of error
      return true;
    }
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указан';
    
    try {
      // Пробуем создать объект Date из входной строки
      let date;
      
      if (dateString instanceof Date) {
        // Если это уже объект Date, используем его
        date = dateString;
      } else if (dateString.includes('T')) {
        // ISO строка с временем (например, "2023-12-01T23:00:00Z")
        date = new Date(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Строка в формате YYYY-MM-DD
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        date = new Date(year, month - 1, day);
      } else {
        // Другие форматы
        date = new Date(dateString);
      }
      
      // Проверяем, что объект Date создан корректно
      if (isNaN(date.getTime())) {
        console.warn('Неверный формат даты:', dateString);
        return 'Некорректная дата';
      }
      
      // Форматируем дату
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Ошибка форматирования даты:', error, dateString);
      return 'Ошибка даты';
    }
  };
  
  // Calculate days remaining until deadline
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    try {
      const today = new Date();
      let deadline;
      
      // Пробуем создать объект Date из входной строки
      if (dueDate instanceof Date) {
        // Если это уже объект Date, используем его
        deadline = dueDate;
      } else if (dueDate.includes('T')) {
        // ISO строка с временем
        deadline = new Date(dueDate);
      } else if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Формат YYYY-MM-DD
        const [year, month, day] = dueDate.split('-').map(num => parseInt(num, 10));
        deadline = new Date(year, month - 1, day);
      } else {
        // Другие форматы
        deadline = new Date(dueDate);
      }
      
      // Проверяем валидность даты
      if (isNaN(deadline.getTime())) {
        console.warn('Некорректная дата дедлайна:', dueDate);
        return null;
      }
      
      // Clear time part for accurate day calculation
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      
      const timeDiff = deadline.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff;
    } catch (error) {
      console.error('Ошибка расчета дней до дедлайна:', error, dueDate);
      return null;
    }
  };
  
  // Status indicator for deadline
  const DeadlineStatus = ({ dueDate }) => {
    const daysRemaining = getDaysRemaining(dueDate);
    
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) {
      return <span style={{ color: 'red', fontWeight: 'bold' }}>(Просрочено)</span>;
    } else if (daysRemaining === 0) {
      return <span style={{ color: 'orange', fontWeight: 'bold' }}>(Сегодня)</span>;
    } else if (daysRemaining <= 3) {
      return <span style={{ color: 'orange', fontWeight: 'bold' }}>(Скоро: {daysRemaining} дн.)</span>;
    }
    
    return <span style={{ color: 'green' }}>({daysRemaining} дн.)</span>;
  };
  
  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };
  
  return (
    <AssignmentsContainer>
      <AssignmentsHeader>
        <Title>Учебные задания</Title>
        {userRole && userRole.toUpperCase() === 'TEACHER' && (
          <CreateButton onClick={handleCreateClick}>
            <FiPlus />
            Создать задание
          </CreateButton>
        )}
      </AssignmentsHeader>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyMessage>{error}</EmptyMessage>
      ) : filteredAssignments.length === 0 ? (
        <EmptyMessage>Пока нет доступных заданий</EmptyMessage>
      ) : (
        <AssignmentGrid>
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id}>
              <AssignmentTitle>{assignment.title}</AssignmentTitle>
              
              <AssignmentMeta>
                <MetaItem>
                  <FiUsers />
                  {groups.find(g => g.id === assignment.group_id)?.name || 'Группа не указана'}
                </MetaItem>
                
                <MetaItem>
                  <FiCalendar />
                  <span>Срок сдачи: </span>
                  {assignment.deadline || assignment.due_date ? (
                    <>
                      {formatDate(assignment.deadline || assignment.due_date)} <DeadlineStatus dueDate={assignment.deadline || assignment.due_date} />
                    </>
                  ) : (
                    <span style={{ color: "#ff7700" }}>Не указан</span>
                  )}
                </MetaItem>
                
                <MetaItem>
                  <FiUser />
                  <span>Преподаватель: </span>
                  {assignment.teacher_name ? (
                    <span>{assignment.teacher_name}</span>
                  ) : (
                    <span style={{ color: "#ff7700" }}>Не указан</span>
                  )}
                </MetaItem>
              </AssignmentMeta>
              
              <AssignmentDescription>
                {assignment.description}
              </AssignmentDescription>
              
              {userRole && userRole.toUpperCase() === 'TEACHER' ? (
                <AssignmentActions>
                  <ActionButton onClick={() => handleEditClick(assignment)}>
                    <FiEdit />
                    Изменить
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDeleteClick(assignment.id)}>
                    <FiTrash2 />
                    Удалить
                  </ActionButton>
                </AssignmentActions>
              ) : (
                <AssignmentActions>
                  <ActionButton onClick={() => handleViewDetails(assignment)}>
                    <FiFileText />
                    Просмотреть детали
                  </ActionButton>
                </AssignmentActions>
              )}
            </AssignmentCard>
          ))}
        </AssignmentGrid>
      )}
      
      {/* Create/Edit Modal */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingAssignment ? 'Редактировать задание' : 'Создать новое задание'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Введите название задания"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Описание</Label>
                <TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Опишите задание подробно..."
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="deadline">Срок сдачи</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline || formData.due_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="group_id">Группа</Label>
                <Select
                  id="group_id"
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Выберите группу</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Преподаватель</Label>
                <Input
                  value={formData.teacher_name || 'Текущий пользователь'}
                  disabled
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Статус сохранения</Label>
                <div>
                  {saveStatus === 'saving' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1890ff' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #1890ff', borderTopColor: 'transparent', animation: 'spinner 0.8s linear infinite' }}></div>
                      <span>Сохранение...</span>
                    </div>
                  )}
                  {saveStatus === 'success' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'green' }}>
                      <span>✓</span>
                      <span>Успешно сохранено!</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'red' }}>
                      <span>✗</span>
                      <span>Ошибка сохранения</span>
                    </div>
                  )}
                </div>
              </FormGroup>
              
              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : (editingAssignment ? 'Сохранить изменения' : 'Создать задание')}
              </SubmitButton>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Details Modal for Students */}
      {showDetailsModal && selectedAssignment && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Детали задания</ModalTitle>
              <CloseButton onClick={() => setShowDetailsModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <div>
              <h3>{selectedAssignment.title}</h3>
              
              <AssignmentMeta>
                <MetaItem>
                  <FiCalendar />
                  <strong>Срок сдачи:</strong> 
                  {selectedAssignment.deadline || selectedAssignment.due_date ? (
                    <>
                      {formatDate(selectedAssignment.deadline || selectedAssignment.due_date)} <DeadlineStatus dueDate={selectedAssignment.deadline || selectedAssignment.due_date} />
                    </>
                  ) : (
                    <span style={{ color: "#ff7700" }}>Не указан</span>
                  )}
                </MetaItem>
                
                <MetaItem>
                  <FiUser />
                  <strong>Преподаватель:</strong> 
                  {selectedAssignment.teacher_name ? (
                    <span>{selectedAssignment.teacher_name}</span>
                  ) : (
                    <span style={{ color: "#ff7700" }}>Не указан</span>
                  )}
                </MetaItem>
                
                <MetaItem>
                  <FiUsers />
                  <strong>Группа:</strong> {groups.find(g => g.id === selectedAssignment.group_id)?.name || 'Не указана'}
                </MetaItem>
              </AssignmentMeta>
              
              <div style={{ marginTop: '20px' }}>
                <strong>Описание:</strong>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedAssignment.description}
                </p>
              </div>
              
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <SubmitButton onClick={() => setShowDetailsModal(false)}>
                  Закрыть
                </SubmitButton>
              </div>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </AssignmentsContainer>
  );
};

export default Assignments; 