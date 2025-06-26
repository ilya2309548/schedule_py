import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiUsers, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import { scheduleService, groupsService } from '../services/apiServices';

const ScheduleContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const ScheduleHeader = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  color: ${COLORS.primary};
  font-size: 32px;
  margin-bottom: 8px;
`;

const WeekNavigation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const WeekContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const WeekTitle = styled.h3`
  color: ${COLORS.textSecondary};
  font-size: 16px;
  margin-bottom: 8px;
`;

const DayButton = styled.button`
  background-color: ${({ isActive }) => isActive ? COLORS.primary : COLORS.white};
  color: ${({ isActive }) => isActive ? COLORS.white : COLORS.text};
  border: 1px solid ${({ isActive }) => isActive ? COLORS.primary : COLORS.darkGray};
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: ${({ isActive }) => isActive ? '500' : '400'};
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ isActive }) => isActive ? COLORS.primary : COLORS.accent};
    border-color: ${COLORS.primary};
  }
  
  @media (max-width: 768px) {
    min-width: 100px;
    padding: 8px 12px;
  }
`;

const DayName = styled.span`
  font-size: 16px;
  margin-bottom: 4px;
`;

const DayDate = styled.span`
  font-size: 14px;
  color: ${({ isActive }) => isActive ? COLORS.white : COLORS.textSecondary};
`;

const ScheduleGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const ClassCard = styled.div`
  background-color: ${COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 20px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const TimeBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 20px;
  border-right: 1px solid ${COLORS.darkGray};
  
  @media (max-width: 600px) {
    padding-right: 0;
    padding-bottom: 12px;
    border-right: none;
    border-bottom: 1px solid ${COLORS.darkGray};
    flex-direction: row;
    gap: 12px;
    justify-content: center;
  }
`;

const ClassNumber = styled.div`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  margin-bottom: 8px;
`;

const ClassTime = styled.div`
  font-size: 14px;
  color: ${COLORS.textSecondary};
  text-align: center;
`;

const ClassDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ClassTitle = styled.h3`
  color: ${COLORS.text};
  font-size: 18px;
  margin: 0;
`;

const ClassInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  font-size: 14px;
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

// Modal styles
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
  max-width: 500px;
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
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${COLORS.text};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
  }
`;

const SubmitButton = styled.button`
  background-color: ${COLORS.primary};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
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
  margin-bottom: 16px;
  
  &:hover {
    background-color: ${COLORS.primaryDark};
  }
`;

const ClassActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.danger ? COLORS.danger : COLORS.light};
  color: ${props => props.danger ? 'white' : COLORS.text};
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.danger ? COLORS.dangerDark : COLORS.accent};
  }
`;

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [activeWeek, setActiveWeek] = useState('current');
  const [userRole, setUserRole] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    room: '',
    group_id: ''
  });
  
  // Get days of the current week
  const daysOfWeek = [
    { name: 'Понедельник', value: 'monday' },
    { name: 'Вторник', value: 'tuesday' },
    { name: 'Среда', value: 'wednesday' },
    { name: 'Четверг', value: 'thursday' },
    { name: 'Пятница', value: 'friday' },
    { name: 'Суббота', value: 'saturday' }
  ];
  
  // Calculate dates for current week and next week
  const getDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const startDate = new Date(today);
    
    // Adjust to get Monday as the first day
    startDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    // Create array for two weeks (current week + next week)
    const twoWeeksDays = [];
    
    // First week (current)
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      twoWeeksDays.push({
        ...day,
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
        week: 'current'
      });
    });
    
    // Second week (next)
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index + 7); // Add 7 days to get next week
      twoWeeksDays.push({
        ...day,
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }),
        week: 'next'
      });
    });
    
    return twoWeeksDays;
  };
  
  const days = getDates();
  
  // Effect to load user data when component mounts
  useEffect(() => {
    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'STUDENT');
  }, []);
  
  // Effect to fetch schedule when day or week changes
  useEffect(() => {
    if (userRole) {
      fetchSchedule();
    }
  }, [selectedDay, activeWeek, userRole]);
  
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Find the selected day object with date
      const selectedDayObj = days.find(
        day => day.value === selectedDay && day.week === activeWeek
      );
      
      if (!selectedDayObj) {
        throw new Error('День не найден');
      }
      
      // Convert date from "DD.MM" format to "YYYY-MM-DD" for API
      const dateParts = selectedDayObj.date.split('.');
      const currentYear = new Date().getFullYear();
      const selectedDate = `${currentYear}-${dateParts[1]}-${dateParts[0]}`;
      
      // Fetch schedule data for the selected day
      // Use new endpoint that accepts date parameter or fallback to day-of-week
      let data;
      try {
        // First try to fetch by specific date
        data = await scheduleService.getSchedule(`?start_date=${selectedDate}&end_date=${selectedDate}`);
      } catch (error) {
        // Fallback to day-of-week endpoint
        data = await scheduleService.getScheduleByDay(selectedDay);
      }
      
      // Format times to remove milliseconds and sort by start time
      const formattedData = data.map(item => ({
        ...item,
        start_time: item.start_time.substring(0, 5), // HH:MM format
        end_time: item.end_time.substring(0, 5), // HH:MM format
        // Add class number for UI display
        class_number: 0, // This will be assigned after sorting
        // Add room from the backend field
        room: item.room,
        // Add teacher and group info
        teacher: item.teacher_name || 'Преподаватель не указан',
        group_name: item.group_name || 'Группа не указана',
        location: item.room || 'Аудитория не указана'
      }));
      
      // Sort by start time
      formattedData.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      // Assign class numbers after sorting
      formattedData.forEach((item, index) => {
        item.class_number = index + 1;
      });
      
      setSchedule(formattedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Не удалось загрузить расписание. Пожалуйста, попробуйте позже.');
      // For demo, set empty data
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch groups for teachers
  const fetchGroups = async () => {
    try {
      const data = await groupsService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };
  
  // Load groups when component mounts for teachers
  useEffect(() => {
    if (userRole && userRole.toUpperCase() === 'TEACHER') {
      fetchGroups();
    }
  }, [userRole]);
  
  const handleCreateClick = () => {
    setEditingSchedule(null);
    
    // Get the selected date
    const selectedDayObj = days.find(
      day => day.value === selectedDay && day.week === activeWeek
    );
    
    if (selectedDayObj) {
      const dateParts = selectedDayObj.date.split('.');
      const currentYear = new Date().getFullYear();
      const selectedDate = `${currentYear}-${dateParts[1]}-${dateParts[0]}`;
      
      setFormData({
        subject: '',
        date: selectedDate,
        start_time: '',
        end_time: '',
        room: '',
        group_id: ''
      });
    }
    
    setShowModal(true);
  };
  
  const handleEditClick = (scheduleItem) => {
    setEditingSchedule(scheduleItem);
    
    // Convert date to YYYY-MM-DD format
    const dateParts = scheduleItem.date.split('.');
    const currentYear = new Date().getFullYear();
    const formattedDate = `${currentYear}-${dateParts[1]}-${dateParts[0]}`;
    
    setFormData({
      subject: scheduleItem.subject,
      date: formattedDate,
      start_time: scheduleItem.start_time,
      end_time: scheduleItem.end_time,
      room: scheduleItem.room,
      group_id: scheduleItem.group_id
    });
    
    setShowModal(true);
  };
  
  const handleDeleteClick = async (scheduleId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту пару?')) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        fetchSchedule(); // Refresh schedule
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert(`Ошибка при удалении пары: ${error.detail || 'Неизвестная ошибка'}`);
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get current user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const scheduleData = {
        ...formData,
        teacher_id: user.id
      };
      
      if (editingSchedule) {
        await scheduleService.updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await scheduleService.createSchedule(scheduleData);
      }
      
      setShowModal(false);
      fetchSchedule(); // Refresh schedule
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(`Ошибка при сохранении пары: ${error.detail || 'Неизвестная ошибка'}`);
    }
  };
  
  return (
    <ScheduleContainer>
      <ScheduleHeader>
        <Title>Расписание занятий</Title>
        {userRole && userRole.toUpperCase() === 'TEACHER' && (
          <CreateButton onClick={handleCreateClick}>
            <FiPlus />
            Добавить пару
          </CreateButton>
        )}
      </ScheduleHeader>
      
      <WeekNavigation>
        <div>
          <WeekTitle>Текущая неделя</WeekTitle>
          <WeekContainer>
            {days.filter(day => day.week === 'current').map((day) => (
              <DayButton
                key={day.value + '-current'}
                isActive={selectedDay === day.value && activeWeek === 'current'}
                onClick={() => {
                  setSelectedDay(day.value);
                  setActiveWeek('current');
                }}
              >
                <DayName>{day.name}</DayName>
                <DayDate isActive={selectedDay === day.value && activeWeek === 'current'}>{day.date}</DayDate>
              </DayButton>
            ))}
          </WeekContainer>
        </div>
        
        <div>
          <WeekTitle>Следующая неделя</WeekTitle>
          <WeekContainer>
            {days.filter(day => day.week === 'next').map((day) => (
              <DayButton
                key={day.value + '-next'}
                isActive={selectedDay === day.value && activeWeek === 'next'}
                onClick={() => {
                  setSelectedDay(day.value);
                  setActiveWeek('next');
                }}
              >
                <DayName>{day.name}</DayName>
                <DayDate isActive={selectedDay === day.value && activeWeek === 'next'}>{day.date}</DayDate>
              </DayButton>
            ))}
          </WeekContainer>
        </div>
      </WeekNavigation>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyMessage>{error}</EmptyMessage>
      ) : schedule.length === 0 ? (
        <EmptyMessage>На этот день нет занятий</EmptyMessage>
      ) : (
        <ScheduleGrid>
          {schedule.map((classItem) => (
            <ClassCard key={classItem.id}>
              <TimeBlock>
                <ClassNumber>{classItem.class_number}</ClassNumber>
                <ClassTime>
                  {classItem.start_time}<br/>
                  {classItem.end_time}
                </ClassTime>
              </TimeBlock>
              
              <ClassDetails>
                <ClassTitle>{classItem.subject}</ClassTitle>
                
                <ClassInfo>
                  {/* Teacher info - show for students */}
                  {!(userRole && userRole.toUpperCase() === 'TEACHER') && (
                    <InfoItem>
                      <FiUser />
                      {classItem.teacher}
                    </InfoItem>
                  )}
                  
                  {/* Group info - show for everyone */}
                  <InfoItem>
                    <FiUsers />
                    {classItem.group_name}
                  </InfoItem>
                  
                  {/* Room is shown for everyone */}
                  <InfoItem>
                    <FiMapPin />
                    {classItem.location}
                  </InfoItem>
                  
                  <InfoItem>
                    <FiClock />
                    {classItem.start_time} - {classItem.end_time}
                  </InfoItem>
                </ClassInfo>
                
                {/* Action buttons for teachers */}
                {userRole && userRole.toUpperCase() === 'TEACHER' && (
                  <ClassActions>
                    <ActionButton onClick={() => handleEditClick(classItem)}>
                      <FiEdit />
                      Изменить
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteClick(classItem.id)}>
                      <FiTrash2 />
                      Удалить
                    </ActionButton>
                  </ClassActions>
                )}
              </ClassDetails>
            </ClassCard>
          ))}
        </ScheduleGrid>
      )}
      
      {/* Create/Edit Modal */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingSchedule ? 'Редактировать пару' : 'Добавить новую пару'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="subject">Предмет</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Введите название предмета"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="date">Дата</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="start_time">Время начала</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="end_time">Время окончания</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="room">Аудитория</Label>
                <Input
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Введите номер аудитории"
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
              
              <SubmitButton type="submit">
                {editingSchedule ? 'Сохранить изменения' : 'Добавить пару'}
              </SubmitButton>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </ScheduleContainer>
  );
};

export default Schedule; 