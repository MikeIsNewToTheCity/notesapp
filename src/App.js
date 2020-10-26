import React, { useEffect, useReducer } from 'react';
import logo from './logo.svg';
import './App.css';

import { API } from 'aws-amplify';
import { List, Input, Button } from 'antd';
import 'antd/dist/antd.css';
import { listNotes } from './graphql/queries';

import { v4 as uuid } from 'uuid';
import { createNote as CreateNote } from './graphql/mutations';

const App = () => {

  const CLIENT_ID = uuid();
  console.log(CLIENT_ID);

  const initialState = {
    notes: []
    , loading: true
    , error: false
    , form: { 
        name: ''
        , description: '' 
      }
  };

  const reducer = (state, action) => {

    switch(action.type) {

      case 'SET_NOTES':
        return {
          ...state
          , notes: action.notes
          , loading: false
        };

      case 'ERROR':
        return {
          ...state
          , laoding: false
          , error: true
        };

      case 'ADD_NOTE':
        return {
          ...state
          , notes: [
              ...state.notes
              , action.note
            ]
        };

      case 'RESET_FORM':
        return {
          ...state
          , form: initialState.form
        };

      case 'SET_INPUT':
        return {
          ...state
          , form: {
              ...state.form
              , [action.name]: action.value
          }
        }

      default:
        return { 
          ...state 
        };
    }

  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async () => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      });
      dispatch({
        type: 'SET_NOTES'
        , notes: notesData.data.listNotes.items
      });
    }

    catch (err) {
      console.error(err);
      dispatch({
        type: 'ERROR'
      })
    }
  }

  const createNote = async () => {
    const { form } = state
    if (!form.name || !form.description) {
      return alert('please enter a name and description');
    }

    const note = { 
      ...form  // spreads in name and description
      , clieantID: CLIENT_ID  // Was mispelled in model
      , completed: false
      , id: uuid()
    }

    dispatch({ 
      type: 'ADD_NOTE'
      , note 
    });

    dispatch({
      type: 'RESET_FORM'
    });

    try {
      await API.graphql({
        query: CreateNote
        , variables: { input: note }
      });
      console.log('successfully created note!');
    }

    catch (err) {
      console.log("error: ", err);
    }

  }

  const onChange = (e) => {
    dispatch({
      type: 'SET_INPUT'
      , name: e.target.name
      , value: e.target.value
    });
  }

  useEffect(
    () => {
      fetchNotes();
    }
    , []
  );

  const styles = {
    container: {padding: 20},
    input: {marginBottom: 10},
    item: { textAlign: 'left' },
    p: { color: '#1890ff' }
  }

  const renderItem = (item) => {
    return (
      <List.Item
        style={styles.item}
      >
      <List.Item.Meta
        title={item.name}
        description={item.description}
      />
      </List.Item>    
    )
  }


  return (
    <div
      style={styles.container}
    >
      <Input 
        placeholder='Note Name'
        style={styles.input}
        name='name'
        onChange={onChange}
        value={state.form.name}
      />
      <Input 
        placeholder='Note Description'
        style={styles.input}
        name='description'
        onChange={onChange}
        value={state.form.description}
      />
      <Button
        type='primary'
        onClick={createNote}
      >
        Create New note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
