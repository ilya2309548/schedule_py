import React, { useState, useEffect } from 'react';
import { Table, Button, Dropdown, Form, Alert, Spinner, Card, Tab, Tabs } from 'react-bootstrap';
import { attendanceService, scheduleService, groupsService } from '../services/apiServices';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [stats, setStats] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('student');
  const [tabsKey, setTabsKey] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        
        if (!user) {
          console.error('Authentication error: No user found in local storage or session');
          setError('Ошибка авторизации: пользователь не найден');
          navigate('/login');
          return;
        }
        
        console.log('User authenticated:', user.username, 'Role:', user.role);
        setUserRole(user.role);
        
        // Установка активного таба в зависимости от роли напрямую
        if (user.role && user.role.toUpperCase() === 'STUDENT') {
          console.log('Установка вкладки студента');
          setActiveTab('student');
          fetchStudentData();
        } else {
          console.log('Установка вкладки преподавателя');
          setActiveTab('today');
          fetchTeacherData();
        }
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        setError('Ошибка проверки авторизации');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Фильтруем расписание при выборе группы
  useEffect(() => {
    if (selectedGroup && scheduleData.length > 0) {
      const filtered = scheduleData.filter(schedule => schedule.group_id === selectedGroup.id);
      setFilteredSchedule(filtered);
    } else {
      setFilteredSchedule(scheduleData);
    }
  }, [selectedGroup, scheduleData]);

  const fetchTodaySchedule = async () => {
    try {
      setError(null);
      console.log('Начинаем загрузку пар на сегодня...');
      
      const response = await axios.get('/api/schedule/today');
      console.log('Получены пары на сегодня:', response.data);
      setTodaySchedule(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке расписания на сегодня:', error);
      console.log('Детали ошибки:', error.response?.data || 'Нет дополнительных данных');
      setError('Не удалось загрузить пары на сегодня: ' + (error.message || 'Неизвестная ошибка'));
      setTodaySchedule([]);
    }
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем расписание преподавателя
      const scheduleResponse = await scheduleService.getSchedule();
      setScheduleData(scheduleResponse);
      setFilteredSchedule(scheduleResponse);
      
      // Получаем список групп
      const groupsResponse = await groupsService.getGroups();
      setGroups(groupsResponse);
      
      // Отделяем вызов для расписания на сегодня, чтобы он не блокировал загрузку страницы
      fetchTodaySchedule().catch(e => console.error('Неблокирующая ошибка:', e));
      
    } catch (error) {
      console.error('Ошибка при загрузке данных преподавателя:', error);
      setError(error.detail || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Пытаемся получить данные о посещаемости студента
        const attendanceResponse = await attendanceService.getAttendance();
        console.log('Полученные данные посещаемости:', attendanceResponse);
        
        // Убедимся, что у нас всегда есть массив
        const attendanceArray = Array.isArray(attendanceResponse) ? attendanceResponse : [];
        
        // Добавляем проверку и логирование данных
        if (attendanceArray.length > 0) {
          console.log('Пример первой записи посещаемости:', JSON.stringify(attendanceArray[0]));
        } else {
          console.warn('Получен пустой массив или некорректные данные посещаемости');
        }
        
        setStudentAttendance(attendanceArray);
      } catch (attendanceError) {
        console.error('Ошибка при загрузке данных посещаемости:', attendanceError);
        setError('Не удалось загрузить данные посещаемости. ' + (attendanceError.detail || ''));
        // Устанавливаем пустой массив чтобы компонент корректно отображался
        setStudentAttendance([]);
      }
      
      try {
        // Пытаемся получить статистику посещаемости
        const statsData = await attendanceService.getAttendanceStats();
        console.log('Полученная статистика:', statsData);
        setStats(statsData);
      } catch (statsError) {
        console.error('Ошибка при загрузке статистики:', statsError);
        // Не устанавливаем общую ошибку, чтобы не перезаписать возможную ошибку посещаемости
        // Просто оставляем stats как null, что обрабатывается в шаблоне
      }
      
    } catch (error) {
      console.error('Глобальная ошибка при загрузке данных студента:', error);
      setError(error.detail || 'Ошибка при загрузке данных');
      // Устанавливаем пустые значения
      setStudentAttendance([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      setLoading(true);
      setError(null);
      
      console.log('Выбрана пара ID:', schedule.id);
      
      // Получаем данные о студентах для выбранной пары с новым API
      try {
        const studentsData = await axios.get(`/api/attendance/students_by_schedule/${schedule.id}`);
        const students = studentsData.data;
        console.log('Получены студенты с посещаемостью:', students);
        
        if (students && Array.isArray(students)) {
          setAttendanceData(students);
        } else {
          setError('Неверный формат данных от сервера при получении списка студентов');
          setAttendanceData([]);
        }
      } catch (error) {
        console.error('Ошибка при получении студентов по расписанию:', error);
        
        // Если произошла ошибка с новым API, пробуем получить через старый способ
        try {
          // Получаем данные о посещаемости по расписанию
          const attendanceData = await attendanceService.getAttendanceBySchedule(schedule.id);
          console.log('Полученные данные о посещаемости по расписанию:', attendanceData);
          
          if (attendanceData && attendanceData.length > 0) {
            setAttendanceData(attendanceData);
          } else {
            // Если нет данных о посещаемости, получаем список студентов из группы
            try {
              // Получаем список студентов группы
              const groupResponse = await axios.get(`/api/groups/${schedule.group_id}/students/list`);
              const students = groupResponse.data;
              
              // Создаем записи о посещаемости для каждого студента
              const defaultAttendance = students.map(student => ({
                student_id: student.id,
                student_name: student.full_name,
                status: 'present', // По умолчанию все присутствуют
                schedule_id: schedule.id
              }));
              
              setAttendanceData(defaultAttendance);
            } catch (error) {
              console.error('Ошибка при получении списка студентов:', error);
              setError('Не удалось получить список студентов для отметки посещаемости');
              setAttendanceData([]);
            }
          }
        } catch (error) {
          console.error('Ошибка при получении данных о посещаемости:', error);
          setError('Не удалось получить данные о посещаемости студентов');
          setAttendanceData([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при выборе пары:', error);
      setError('Ошибка при загрузке данных о посещаемости');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);
  };

  const handleAttendanceChange = (studentId, status) => {
    // Преобразуем значения статусов в нижний регистр для соответствия API
    const normalizedStatus = status.toLowerCase();
    
    // Обновляем локальное состояние
    const updatedAttendance = attendanceData.map(item => {
      if (item.student_id === studentId) {
        return { 
          ...item, 
          status: normalizedStatus,
          attendance_status: normalizedStatus  // Добавляем обновление для обоих полей
        };
      }
      return item;
    });
    
    setAttendanceData(updatedAttendance);
  };

  const saveAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // Подготавливаем данные для массового обновления
      const attendanceMap = {};
      attendanceData.forEach(item => {
        // Используем статус из любого доступного поля
        const status = item.attendance_status || item.status || 'present';
        attendanceMap[item.student_id] = status;
      });
      
      const bulkData = {
        schedule_id: selectedSchedule.id,
        attendance_data: attendanceMap
      };
      
      console.log('Отправляемые данные о посещаемости:', bulkData);
      
      // Отправляем запрос на сервер
      const result = await attendanceService.bulkAttendance(bulkData);
      
      setSuccessMessage('Посещаемость успешно сохранена');
      
      // Обновляем данные о посещаемости после сохранения
      try {
        // Пробуем получить через новый API
        const updatedStudents = await axios.get(`/api/attendance/students_by_schedule/${selectedSchedule.id}`);
        setAttendanceData(updatedStudents.data);
      } catch (error) {
        // Если не получилось, используем старый способ
        const updatedAttendance = await attendanceService.getAttendanceBySchedule(selectedSchedule.id);
        setAttendanceData(updatedAttendance);
      }
      
    } catch (error) {
      console.error('Ошибка при сохранении посещаемости:', error);
      setError('Ошибка при сохранении посещаемости: ' + (error.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  // Добавим отладочный код перед возвратом компонента
  useEffect(() => {
    if (studentAttendance.length > 0) {
      console.log("Данные посещаемости готовы к отображению:", studentAttendance.length, "записей");
    }
    if (activeTab) {
      console.log("Активная вкладка:", activeTab);
    }
  }, [studentAttendance, activeTab]);

  // Добавим также принудительное обновление данных при изменении вкладки
  useEffect(() => {
    if (activeTab === 'student') {
      console.log('Активирована вкладка студента, обновляем данные');
      fetchStudentData();
    } else if (activeTab === 'today' || activeTab === 'teacher') {
      console.log('Активирована вкладка преподавателя, обновляем данные');
      fetchTeacherData();
    }
  }, [activeTab]);

  // Используем переменные для вкладок
  const showTeacherTabs = userRole?.toUpperCase() === 'TEACHER' || userRole?.toUpperCase() === 'ADMIN';
  const showStudentTabs = userRole?.toUpperCase() === 'STUDENT' || userRole?.toUpperCase() === 'ADMIN';

  // Отладочный вывод для вкладок
  console.log('Available tabs - Teacher:', showTeacherTabs, 'Student:', showStudentTabs, 'Current tab:', activeTab);
  console.log('User role (raw):', userRole);

  console.log('Final render state:', {
    showTeacherTabs,
    showStudentTabs,
    activeTab,
    userRole,
    studentAttendance: studentAttendance.length
  });

  if (loading && !selectedSchedule) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Посещаемость</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      <Tabs 
        key={tabsKey}
        activeKey={activeTab} 
        onSelect={(k) => {
          console.log("Переключение на вкладку:", k);
          setActiveTab(k);
          // Форсируем перерисовку компонента
          setTabsKey(Date.now());
        }} 
        id="attendance-tabs"
        className="mb-4"
        style={{ display: 'block', visibility: 'visible' }}
      >
        {showTeacherTabs && (
          <Tab eventKey="today" title="Сегодняшние пары">
            <div className="row">
              <div className="col-md-12">
                <Card>
                  <Card.Header>Пары на сегодня</Card.Header>
                  <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {todaySchedule.length > 0 ? (
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Предмет</th>
                            <th>Группа</th>
                            <th>Время</th>
                            <th>Аудитория</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaySchedule.map(schedule => (
                            <tr key={schedule.id}>
                              <td>{schedule.subject}</td>
                              <td>{schedule.group_name}</td>
                              <td>{schedule.start_time} - {schedule.end_time}</td>
                              <td>{schedule.room}</td>
                              <td>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  onClick={() => handleScheduleSelect(schedule)}
                                >
                                  Отметить посещаемость
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p>На сегодня у вас нет пар.</p>
                        <Button variant="outline-primary" onClick={fetchTodaySchedule}>
                          Обновить
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
                
                {selectedSchedule && (
                  <Card className="mt-4">
                    <Card.Header>Отметить посещаемость: {selectedSchedule.subject}</Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {loading ? (
                        <div className="d-flex justify-content-center my-3">
                          <Spinner animation="border" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <h5>{selectedSchedule.subject} ({selectedSchedule.date})</h5>
                            <p>Группа: {selectedSchedule.group_name}, Время: {selectedSchedule.start_time} - {selectedSchedule.end_time}</p>
                          </div>
                          
                          {attendanceData.length > 0 ? (
                            <>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>Студент</th>
                                    <th>Статус</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendanceData.map(student => (
                                    <tr key={student.student_id}>
                                      <td>{student.full_name || student.student_name}</td>
                                      <td>
                                        <Form.Select 
                                          value={student.attendance_status || student.status || 'present'}
                                          onChange={(e) => handleAttendanceChange(student.student_id, e.target.value)}
                                        >
                                          <option value="present">Присутствует</option>
                                          <option value="absent">Отсутствует</option>
                                          <option value="late">Опоздал</option>
                                          <option value="excused">Уважительная причина</option>
                                        </Form.Select>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                              
                              <Button 
                                variant="success" 
                                onClick={saveAttendance} 
                                disabled={loading}
                                className="mt-3"
                              >
                                {loading ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p>Не удалось загрузить список студентов для отметки посещаемости.</p>
                              <Button variant="primary" onClick={() => handleScheduleSelect(selectedSchedule)}>
                                Попробовать снова
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </div>
            </div>
          </Tab>
        )}
        
        {showTeacherTabs && (
          <Tab eventKey="teacher" title="Управление посещаемостью">
            <div className="row mb-4">
              <div className="col-md-12 mb-3">
                <div className="d-flex">
                  <Form.Group className="me-3" style={{ minWidth: '200px' }}>
                    <Form.Label>Выберите группу:</Form.Label>
                    <Form.Select 
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId === "all") {
                          setSelectedGroup(null);
                        } else {
                          const group = groups.find(g => g.id === selectedId);
                          handleGroupSelect(group);
                        }
                      }}
                    >
                      <option value="all">Все группы</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              
              <div className="col-md-6">
                <Card>
                  <Card.Header>Выберите пару</Card.Header>
                  <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Предмет</th>
                          <th>Группа</th>
                          <th>Время</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSchedule.length > 0 ? (
                          filteredSchedule.map(schedule => (
                            <tr key={schedule.id} className={selectedSchedule?.id === schedule.id ? 'table-primary' : ''}>
                              <td>{schedule.date}</td>
                              <td>{schedule.subject}</td>
                              <td>{schedule.group_name}</td>
                              <td>{schedule.start_time} - {schedule.end_time}</td>
                              <td>
                                <Button 
                                  size="sm" 
                                  variant={selectedSchedule?.id === schedule.id ? 'primary' : 'outline-primary'}
                                  onClick={() => handleScheduleSelect(schedule)}
                                >
                                  Отметить
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">
                              {selectedGroup ? 'Нет пар для выбранной группы' : 'Нет доступных пар'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
              
              <div className="col-md-6">
                {selectedSchedule && (
                  <Card>
                    <Card.Header>Отметить посещаемость</Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {loading ? (
                        <div className="d-flex justify-content-center my-3">
                          <Spinner animation="border" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <h5>{selectedSchedule.subject} ({selectedSchedule.date})</h5>
                            <p>Группа: {selectedSchedule.group_name}, Время: {selectedSchedule.start_time} - {selectedSchedule.end_time}</p>
                          </div>
                          
                          {attendanceData.length > 0 ? (
                            <>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>Студент</th>
                                    <th>Статус</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendanceData.map(student => (
                                    <tr key={student.student_id}>
                                      <td>{student.full_name || student.student_name}</td>
                                      <td>
                                        <Form.Select 
                                          value={student.attendance_status || student.status || 'present'}
                                          onChange={(e) => handleAttendanceChange(student.student_id, e.target.value)}
                                        >
                                          <option value="present">Присутствует</option>
                                          <option value="absent">Отсутствует</option>
                                          <option value="late">Опоздал</option>
                                          <option value="excused">Уважительная причина</option>
                                        </Form.Select>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                              
                              <Button 
                                variant="success" 
                                onClick={saveAttendance} 
                                disabled={loading}
                                className="mt-3"
                              >
                                {loading ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p>Не удалось загрузить список студентов для отметки посещаемости.</p>
                              <Button variant="primary" onClick={() => handleScheduleSelect(selectedSchedule)}>
                                Попробовать снова
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </div>
            </div>
          </Tab>
        )}
        
        {/* Always show the student tab for debugging */}
        <Tab eventKey="student" title="Моя посещаемость">
          <div className="row">
            <div className="col-md-8">
              <Card>
                <Card.Header>
                  История посещаемости {studentAttendance.length > 0 && <span className="text-muted ms-2">({studentAttendance.length})</span>}
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {loading ? (
                    <div className="d-flex justify-content-center py-4">
                      <Spinner animation="border" />
                    </div>
                  ) : studentAttendance.length > 0 ? (
                    <>
                      <div className="mb-3">
                        <p className="text-muted">Найдено записей о посещаемости: {studentAttendance.length}</p>
                      </div>
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Дата</th>
                            <th>Предмет</th>
                            <th>Время</th>
                            <th>Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentAttendance.map((record, index) => (
                            <tr key={index}>
                              <td>{record.date || "Нет даты"}</td>
                              <td>{record.subject || "Нет предмета"}</td>
                              <td>{record.start_time || "?"} - {record.end_time || "?"}</td>
                              <td>
                                {record.status === 'present' && <span className="text-success">Присутствовал</span>}
                                {record.status === 'absent' && <span className="text-danger">Отсутствовал</span>}
                                {record.status === 'late' && <span className="text-warning">Опоздал</span>}
                                {record.status === 'excused' && <span className="text-info">Уважительная причина</span>}
                                {!record.status && <span className="text-secondary">Статус не определен</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p>У вас пока нет записей о посещаемости.</p>
                      <Button 
                        variant="outline-primary" 
                        onClick={fetchStudentData} 
                        className="mt-2"
                      >
                        Обновить данные
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
            
            <div className="col-md-4">
              <Card>
                <Card.Header>Статистика посещаемости</Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="d-flex justify-content-center py-4">
                      <Spinner animation="border" />
                    </div>
                  ) : stats ? (
                    <>
                      <h5>Общая статистика</h5>
                      <p>Всего занятий: {stats.total_classes || 0}</p>
                      <p>Присутствовал: {stats.present_count || 0} ({stats.present_percentage ? stats.present_percentage.toFixed(1) : 0}%)</p>
                      <p>Отсутствовал: {stats.absent_count || 0} ({stats.absent_percentage ? stats.absent_percentage.toFixed(1) : 0}%)</p>
                      <p>Опоздал: {stats.late_count || 0} ({stats.late_percentage ? stats.late_percentage.toFixed(1) : 0}%)</p>
                      <p>Уважительная причина: {stats.excused_count || 0} ({stats.excused_percentage ? stats.excused_percentage.toFixed(1) : 0}%)</p>
                      <hr />
                      <p><strong>Общий процент посещаемости: {stats.attendance_percentage ? stats.attendance_percentage.toFixed(1) : 0}%</strong></p>
                      <p><strong>Пропущено часов: {stats.missed_hours ? stats.missed_hours.toFixed(1) : 0} ч.</strong></p>
                      <p className="text-muted small">Отсутствие: 2 часа, опоздание: 1 час</p>
                    </>
                  ) : (
                    <div>
                      <p>Не удалось загрузить статистику посещаемости.</p>
                      <p className="text-muted">Статистика временно недоступна. Пожалуйста, попробуйте позже.</p>
                      <Button 
                        variant="outline-primary" 
                        onClick={fetchStudentData} 
                        className="mt-2"
                        size="sm"
                      >
                        Обновить данные
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Attendance; 